import { createServerClient } from "@/lib/supabase/server";
import { buildThinkingPartnerPrompt } from "@/lib/prompts/thinking-partner";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { documentId, message } = await request.json();

    if (!documentId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing documentId or message" }),
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Fetch document with linked capture and insights
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select(
        `
        *,
        captures:capture_id (
          id,
          transcription,
          insights (
            type,
            content
          )
        )
      `
      )
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
      });
    }

    // Get or create conversation for this document
    let { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("document_id", documentId)
      .single();

    if (convError || !conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert({
          document_id: documentId,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (createError || !newConv) {
        return new Response(
          JSON.stringify({ error: "Failed to create conversation" }),
          { status: 500 }
        );
      }

      conversation = newConv;
    }

    // Load conversation history (last 20 messages for context)
    const { data: historyMessages, error: historyError } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(20);

    if (historyError) {
      return new Response(
        JSON.stringify({ error: "Failed to load conversation history" }),
        { status: 500 }
      );
    }

    // Convert Tiptap JSON to plain text for context
    const documentPlainText = convertTiptapToPlainText(document.content);

    // Build system prompt with context
    const systemPrompt = buildThinkingPartnerPrompt({
      documentTitle: document.title,
      documentContent: documentPlainText,
      transcription: document.captures?.transcription,
      insights: document.captures?.insights || [],
      conversationHistory: historyMessages || [],
    });

    // Save user message to database
    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      role: "user",
      content: message,
    });

    if (userMsgError) {
      console.error("Failed to save user message:", userMsgError);
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build messages array for Claude
    const messages: Anthropic.MessageParam[] = [
      ...(historyMessages || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Stream response from Claude
    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    });

    // Create a TransformStream to handle streaming and save to DB
    let assistantResponse = "";
    const encoder = new TextEncoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush() {
        // Save assistant response to database after streaming completes
        if (assistantResponse) {
          const { error: assistantMsgError } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversation!.id,
              role: "assistant",
              content: assistantResponse,
            });

          if (assistantMsgError) {
            console.error("Failed to save assistant message:", assistantMsgError);
          }
        }
      },
    });

    // Create readable stream that captures text and forwards chunks
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              assistantResponse += text;
              await new Promise(resolve => setTimeout(resolve, 75));
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();

          // Save to database after stream completes
          if (assistantResponse) {
            await supabase.from("messages").insert({
              conversation_id: conversation!.id,
              role: "assistant",
              content: assistantResponse,
            });
          }
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

/**
 * Convert Tiptap JSON content to plain text for AI context
 */
function convertTiptapToPlainText(content: any): string {
  if (!content || !content.content) return "";

  let text = "";

  function traverse(node: any) {
    if (node.type === "text") {
      text += node.text;
    } else if (node.type === "hardBreak") {
      text += "\n";
    } else if (node.content) {
      node.content.forEach(traverse);
      // Add spacing after block elements
      if (["paragraph", "heading", "bulletList", "orderedList"].includes(node.type)) {
        text += "\n\n";
      }
    }
  }

  content.content.forEach(traverse);
  return text.trim();
}
