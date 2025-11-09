import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_AGENT_PERSONALITY } from "@/lib/prompts/thinking-partner";

export const runtime = "edge";

/**
 * GET - Fetch document-specific agent prompt
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Missing documentId parameter" }),
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Fetch document with custom prompt
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("custom_agent_prompt")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
      });
    }

    // Fetch user's default prompt as fallback (may not exist yet)
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("default_agent_prompt")
      .eq("user_id", user.id)
      .maybeSingle();

    // Log if there's an error fetching settings (but don't fail the request)
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error("Error fetching user settings:", settingsError);
    }

    return new Response(
      JSON.stringify({
        customPrompt: document.custom_agent_prompt || null,
        userDefaultPrompt: settings?.default_agent_prompt || null,
        systemDefaultPrompt: DEFAULT_AGENT_PERSONALITY,
        activePrompt:
          document.custom_agent_prompt ||
          settings?.default_agent_prompt ||
          DEFAULT_AGENT_PERSONALITY,
        isDocumentCustom: !!document.custom_agent_prompt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching document agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update document-specific agent prompt
 */
export async function PATCH(request: Request) {
  try {
    const { documentId, prompt } = await request.json();

    if (!documentId || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request: documentId and prompt required" }),
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Update document's custom prompt
    const { error: updateError } = await supabase
      .from("documents")
      .update({ custom_agent_prompt: prompt })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error saving document agent prompt:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save prompt" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, prompt }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating document agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Reset document to use user default or system default
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "Missing documentId parameter" }),
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Set custom_agent_prompt to null (meaning use user/system default)
    const { error: updateError } = await supabase
      .from("documents")
      .update({ custom_agent_prompt: null })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error resetting document agent prompt:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset prompt" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error resetting document agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
