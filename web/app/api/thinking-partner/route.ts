import { createServerClient } from "@/lib/supabase/server";
import {
  buildThinkingPartnerPrompt,
  DEFAULT_AGENT_PERSONALITY,
} from "@/lib/prompts/thinking-partner";
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
    const supabase = await createServerClient();

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

    // Fetch document with linked capture and insights (including custom prompt)
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

    // Fetch user's default agent prompt setting
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("default_agent_prompt")
      .eq("user_id", user.id)
      .single();

    // Determine which prompt to use (priority: document > user default > system default)
    const customPrompt =
      document.custom_agent_prompt ||
      userSettings?.default_agent_prompt ||
      DEFAULT_AGENT_PERSONALITY;

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

    // Fetch user's capture database for context
    const { data: allCaptures, error: capturesError } = await supabase
      .from("captures")
      .select(
        `
        id,
        transcription,
        created_at,
        log_date,
        note_type,
        cycle_day,
        cycle_phase,
        insights (type, content)
      `
      )
      .eq("user_id", user.id)
      .not("transcription", "is", null)
      .order("created_at", { ascending: false })
      .limit(50); // Fetch last 50 captures

    if (capturesError) {
      console.error("Failed to fetch captures:", capturesError);
      // Don't fail the whole request if captures can't be fetched
      // Continue without capture database context
    } else {
      console.log(`Fetched ${allCaptures?.length || 0} captures for context`);
    }

    // Filter captures based on relevance
    const relevantCaptures = filterRelevantCaptures(
      allCaptures || [],
      message,
      document.captures?.id // Exclude the current document's capture
    );

    console.log(`Filtered to ${relevantCaptures.length} relevant captures`);

    // Build system prompt with context using custom or default personality
    const context = {
      documentTitle: document.title,
      documentContent: documentPlainText,
      transcription: document.captures?.transcription,
      insights: document.captures?.insights || [],
      conversationHistory: historyMessages || [],
      captureDatabase: relevantCaptures,
    };

    // Use buildThinkingPartnerPrompt but we'll override with custom prompt
    // First build with default to get the context sections
    const defaultPrompt = buildThinkingPartnerPrompt(context);

    // Then rebuild using custom personality
    // Extract context sections by rebuilding just the context
    let contextSection = `## Current Document

**Title:** ${context.documentTitle || "Untitled Document"}

**Content:**
${context.documentContent || "(Document is empty - user is just starting to write)"}
`;

    if (context.transcription || context.insights) {
      contextSection += `\n## Original Voice Note Context\n`;

      if (context.transcription) {
        contextSection += `\n**Original Transcription:**\n"${context.transcription}"\n`;
      }

      if (context.insights && context.insights.length > 0) {
        contextSection += `\n**Extracted Insights:**\n`;

        const groupedInsights = context.insights.reduce((acc: Record<string, string[]>, insight: any) => {
          if (!acc[insight.type]) acc[insight.type] = [];
          acc[insight.type].push(insight.content);
          return acc;
        }, {});

        Object.entries(groupedInsights).forEach(([type, items]) => {
          contextSection += `\n**${type.charAt(0).toUpperCase() + type.slice(1)}s:**\n`;
          items.forEach((item) => {
            contextSection += `- ${item}\n`;
          });
        });
      }
    }

    let captureSection = "";
    if (context.captureDatabase && context.captureDatabase.length > 0) {
      captureSection = `\n## Thought Capture Database\n\n`;
      captureSection += `You have access to ${context.captureDatabase.length} relevant thought captures from the user's history. These are actual voice notes they've recorded, providing rich context for understanding their thinking journey.\n\n`;

      context.captureDatabase.forEach((capture: any, index: number) => {
        const date =
          capture.log_date ||
          new Date(capture.created_at).toISOString().split("T")[0];
        const noteTypeLabel =
          capture.note_type === "intention"
            ? "Morning Intention"
            : capture.note_type === "reflection"
            ? "Evening Reflection"
            : "Daily Capture";

        captureSection += `### ${index + 1}. [${date}] ${noteTypeLabel}\n`;

        if (capture.transcription) {
          const truncated =
            capture.transcription.length > 300
              ? capture.transcription.slice(0, 300) + "..."
              : capture.transcription;
          captureSection += `**Transcription:** "${truncated}"\n`;
        }

        if (capture.insights && capture.insights.length > 0) {
          captureSection += `**Insights:**\n`;
          capture.insights.forEach((insight: any) => {
            captureSection += `- [${insight.type}] ${insight.content}\n`;
          });
        }

        captureSection += `\n`;
      });
    }

    let historySection = "";
    if (context.conversationHistory.length > 0) {
      historySection = `\n## Previous Conversation\n\n`;
      context.conversationHistory.forEach((msg: any) => {
        historySection += `**${msg.role === "user" ? "User" : "Assistant"}:** ${msg.content}\n\n`;
      });
    }

    // Build complete prompt with custom personality
    const systemPrompt = `${customPrompt}

${contextSection}
${captureSection}
${historySection}

---

Now respond to the user's latest message with curiosity and attention to their specific context.`;

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

    console.log(`System prompt length: ${systemPrompt.length} characters`);

    // Stream response from Claude
    let stream;
    try {
      stream = await anthropic.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages,
      });
    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);
      return new Response(
        JSON.stringify({
          error: "Failed to get response from AI",
          details: anthropicError instanceof Error ? anthropicError.message : "Unknown error"
        }),
        { status: 500 }
      );
    }

    // Create readable stream that captures text and forwards chunks
    let assistantResponse = "";
    const encoder = new TextEncoder();

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
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();

          // Save to database after stream completes
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

/**
 * Extract keywords from user message
 */
function extractKeywords(message: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "can",
    "may",
    "might",
    "must",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "this",
    "that",
    "these",
    "those",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "help",
    "tell",
    "show",
    "find",
  ]);

  // Extract words and filter
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Return unique keywords
  return Array.from(new Set(words));
}

/**
 * Filter captures based on relevance to user message
 * Uses hybrid approach: Recent captures + keyword matching
 */
function filterRelevantCaptures(
  captures: any[],
  userMessage: string,
  currentCaptureId?: string
): any[] {
  if (!captures || captures.length === 0) return [];

  // Extract keywords from user message
  const keywords = extractKeywords(userMessage);

  // Always include last 5 captures (recent context)
  const recentCaptures = captures
    .filter((c) => c.id !== currentCaptureId)
    .slice(0, 5);

  // If user message has keywords, find relevant captures
  let keywordMatches: any[] = [];
  if (keywords.length > 0) {
    keywordMatches = captures
      .filter((c) => c.id !== currentCaptureId)
      .map((capture) => {
        // Score based on keyword matches in transcription and insights
        let score = 0;
        const transcriptionLower =
          capture.transcription?.toLowerCase() || "";
        const insightsText = (capture.insights || [])
          .map((i: any) => i.content.toLowerCase())
          .join(" ");

        keywords.forEach((keyword) => {
          // Count occurrences in transcription
          const transcriptionMatches = (
            transcriptionLower.match(new RegExp(keyword, "g")) || []
          ).length;
          // Count occurrences in insights
          const insightMatches = (
            insightsText.match(new RegExp(keyword, "g")) || []
          ).length;

          score += transcriptionMatches * 2; // Weight transcription higher
          score += insightMatches * 1;
        });

        return { capture, score };
      })
      .filter((item) => item.score > 0) // Only include captures with matches
      .sort((a, b) => b.score - a.score) // Sort by relevance
      .slice(0, 10) // Take top 10 matches
      .map((item) => item.capture);
  }

  // Combine recent + keyword matches, removing duplicates
  const captureIds = new Set<string>();
  const combined: any[] = [];

  [...recentCaptures, ...keywordMatches].forEach((capture) => {
    if (!captureIds.has(capture.id)) {
      captureIds.add(capture.id);
      combined.push(capture);
    }
  });

  // Limit to 15 total captures to manage token budget
  return combined.slice(0, 15);
}
