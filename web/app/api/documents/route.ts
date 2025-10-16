import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { capture_id, title, content } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Insert document into database
    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        capture_id: capture_id || null,
        title: title || "Untitled Document",
        content,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating document:", insertError);
      return NextResponse.json(
        { error: "Failed to create document: " + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error("Unexpected error in POST /api/documents:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/documents - List all user's documents
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query documents with optional capture data
    const { data: documents, error: queryError } = await supabase
      .from("documents")
      .select(
        `
        *,
        captures (
          id,
          transcription,
          created_at
        )
      `
      )
      .order("updated_at", { ascending: false })
      .limit(50);

    if (queryError) {
      console.error("Error fetching documents:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch documents: " + queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || [], { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/documents:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
