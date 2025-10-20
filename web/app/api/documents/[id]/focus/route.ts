import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { is_focused } = body;

    // Validate input
    if (typeof is_focused !== "boolean") {
      return NextResponse.json(
        { error: "is_focused must be a boolean" },
        { status: 400 }
      );
    }

    // Update document focus state
    const { data: document, error } = await supabase
      .from("documents")
      .update({ is_focused })
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure user owns the document
      .select()
      .single();

    if (error) {
      console.error("Error updating document focus:", error);
      return NextResponse.json(
        { error: "Failed to update document focus" },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in focus route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
