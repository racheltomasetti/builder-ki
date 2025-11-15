import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch document with capture data and insights
  const { data: document, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      captures (
        id,
        transcription,
        created_at,
        file_url,
        insights (*)
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !document) {
    return (
      <div className="min-h-screen bg-flexoki-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-flexoki-tx mb-2">
            Journal Not Found
          </h1>
          <p className="text-flexoki-tx-2 mb-4">
            The journal you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <a
            href="/dashboard/mind"
            className="text-flexoki-accent hover:underline"
          >
            Back to Journals
          </a>
        </div>
      </div>
    );
  }

  return <DocumentEditor document={document} />;
}
