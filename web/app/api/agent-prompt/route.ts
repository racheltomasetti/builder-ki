import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_AGENT_PERSONALITY } from "@/lib/prompts/thinking-partner";

export const runtime = "edge";

/**
 * GET - Fetch user's default agent prompt
 */
export async function GET() {
  try {
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

    // Fetch user settings (may not exist yet)
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("default_agent_prompt")
      .eq("user_id", user.id)
      .maybeSingle();

    // Log if there's an error fetching settings (but don't fail the request)
    if (settingsError && settingsError.code !== "PGRST116") {
      console.error("Error fetching user settings:", settingsError);
    }

    // Return custom prompt or null (indicating system default should be used)
    return new Response(
      JSON.stringify({
        customPrompt: settings?.default_agent_prompt || null,
        defaultPrompt: DEFAULT_AGENT_PERSONALITY,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user's default agent prompt
 */
export async function PATCH(request: Request) {
  try {
    const { prompt } = await request.json();

    if (typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid prompt format" }),
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

    // Upsert user settings with new default prompt
    const { error: upsertError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_agent_prompt: prompt,
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("Error saving agent prompt:", upsertError);
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
    console.error("Error updating agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Reset user's default agent prompt to system default
 */
export async function DELETE() {
  try {
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

    // Set default_agent_prompt to null (meaning use system default)
    const { error: updateError } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          default_agent_prompt: null,
        },
        {
          onConflict: "user_id",
        }
      );

    if (updateError) {
      console.error("Error resetting agent prompt:", updateError);
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
    console.error("Error resetting agent prompt:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
