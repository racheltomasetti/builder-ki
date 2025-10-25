import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentsList from "@/components/DocumentsList";

export default async function DocumentsPage() {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch all documents with optional capture data
  const { data: documents, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      captures (
        id,
        transcription,
        created_at,
        file_url
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
  }

  return <DocumentsList initialDocuments={documents || []} />;
}
