import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/documents/[id] - Retrieve a single document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document (RLS will ensure user owns it)
    const { data: document, error: queryError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .single();

    if (queryError) {
      if (queryError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching document:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch document: " + queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/documents/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update a document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

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
    const { title, content } = body;

    // Build update object (only include fields that were provided)
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update document (RLS will ensure user owns it)
    // updated_at will be auto-updated by trigger
    const { data: document, error: updateError } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to update document: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error in PATCH /api/documents/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete document (RLS will ensure user owns it)
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Error deleting document:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete document: " + deleteError.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Unexpected error in DELETE /api/documents/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
