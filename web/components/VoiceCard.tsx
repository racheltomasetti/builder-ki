"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Insight = {
  id: string;
  type: "insight" | "decision" | "question" | "concept";
  content: string;
  created_at: string;
};

type Capture = {
  id: string;
  type: string;
  file_url: string;
  transcription: string | null;
  processing_status: string;
  created_at: string;
  processed_at: string | null;
  insights: Insight[];
};

type VoiceCardProps = {
  capture: Capture;
  onDelete?: () => void;
};

export default function VoiceCard({ capture, onDelete }: VoiceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const supabase = createClient();

  const handleExpandThought = async () => {
    setIsExpanding(true);

    try {
      // Build Tiptap document structure with transcription and insights
      const content = {
        type: "doc",
        content: [
          // Original transcription as first paragraph
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: capture.transcription || "No transcription available.",
              },
            ],
          },
          // Add spacing
          {
            type: "paragraph",
            content: [],
          },
          // Insights section
          ...(capture.insights && capture.insights.length > 0
            ? [
                {
                  type: "heading",
                  attrs: { level: 2 },
                  content: [{ type: "text", text: "Insights" }],
                },
                {
                  type: "bulletList",
                  content: capture.insights.map((insight) => ({
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: `${
                              insight.type === "insight"
                                ? "💡"
                                : insight.type === "decision"
                                ? "✅"
                                : insight.type === "question"
                                ? "❓"
                                : "🏷️"
                            } ${insight.content}`,
                          },
                        ],
                      },
                    ],
                  })),
                },
              ]
            : []),
        ],
      };

      // Call API to create document
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capture_id: capture.id,
          title: "Untitled Document",
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create document");
      }

      const document = await response.json();

      // Navigate to the document editor
      window.location.href = `/dashboard/documents/${document.id}`;
    } catch (error: any) {
      console.error("Error expanding thought:", error);
      alert("Failed to expand thought: " + error.message);
      setIsExpanding(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Delete insights first (foreign key constraint)
      const { error: insightsError } = await supabase
        .from("insights")
        .delete()
        .eq("capture_id", capture.id);

      if (insightsError) {
        console.error("Error deleting insights:", insightsError);
        alert("Failed to delete insights: " + insightsError.message);
        setIsDeleting(false);
        return;
      }

      // Delete the capture record
      const { error: captureError } = await supabase
        .from("captures")
        .delete()
        .eq("id", capture.id);

      if (captureError) {
        console.error("Error deleting capture:", captureError);
        alert("Failed to delete capture: " + captureError.message);
        setIsDeleting(false);
        return;
      }

      // Optional: Delete the audio file from storage
      // Extract the file path from the URL
      const urlParts = capture.file_url.split("/voice-notes/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        const { error: storageError } = await supabase.storage
          .from("voice-notes")
          .remove([filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Continue anyway - the database record is deleted
        }
      }

      // Call the onDelete callback to refresh the list
      if (onDelete) {
        onDelete();
      }
    } catch (error: any) {
      console.error("Unexpected error during deletion:", error);
      alert("An unexpected error occurred: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-flexoki-ui rounded-lg shadow-md p-6 relative">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-flexoki-ui border border-flexoki-ui-3 rounded-lg p-6 max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-flexoki-tx mb-2">
              Delete Voice Note?
            </h3>
            <p className="text-flexoki-tx-2 mb-4">
              This will permanently delete this voice note, its transcription,
              and all extracted insights. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-flexoki-tx-2 hover:bg-flexoki-ui-2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-flexoki-tx-2">
          {new Date(capture.created_at).toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              capture.processing_status === "complete"
                ? "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-600"
                : capture.processing_status === "synthesizing"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-600"
                : "bg-flexoki-ui-2 text-flexoki-tx-2"
            }`}
          >
            {capture.processing_status}
          </span>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-flexoki-tx-3 hover:text-red-600 hover:bg-flexoki-ui-2 transition-colors disabled:opacity-50"
            title="Delete voice note"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Audio Player */}
      <div className="mb-4">
        <audio controls className="w-full">
          <source src={capture.file_url} type="audio/m4a" />
          <source src={capture.file_url} type="audio/mp3" />
          <source src={capture.file_url} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Transcription */}
      {capture.transcription && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-flexoki-tx mb-2">
            Transcription
          </h3>
          <p className="text-flexoki-tx leading-relaxed">
            {capture.transcription}
          </p>
        </div>
      )}

      {/* Insights */}
      {capture.insights && capture.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-flexoki-ui-3">
          <h3 className="text-sm font-semibold text-flexoki-tx mb-3">
            Extracted Insights ({capture.insights.length})
          </h3>
          <div className="space-y-2">
            {capture.insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-2 text-sm">
                <span className="text-lg leading-none">
                  {insight.type === "insight" && "💡"}
                  {insight.type === "decision" && "✅"}
                  {insight.type === "question" && "❓"}
                  {insight.type === "concept" && "🏷️"}
                </span>
                <span className="text-flexoki-tx flex-1">
                  {insight.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {capture.processing_status === "complete" && capture.transcription && (
        <div className="mt-4 pt-4 border-t border-flexoki-ui-3 flex justify-end">
          <button
            onClick={handleExpandThought}
            disabled={isExpanding}
            className="px-4 py-2 bg-flexoki-accent opacity-85 hover:opacity-100 text-flexoki-tx rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            title="Expand this thought into a document"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {isExpanding ? "Creating..." : "Expand Thought"}
          </button>
        </div>
      )}
    </div>
  );
}
