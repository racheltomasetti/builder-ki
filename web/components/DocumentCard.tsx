"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Capture = {
  id: string;
  transcription: string | null;
  created_at: string;
};

type Document = {
  id: string;
  user_id: string;
  capture_id: string | null;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  captures?: Capture | null;
};

type DocumentCardProps = {
  document: Document;
  onDelete?: (id: string) => void;
};

export default function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract plain text preview from Tiptap JSON
  const getPreview = (content: any): string => {
    if (!content || !content.content) return "";

    let text = "";
    const traverse = (node: any) => {
      if (node.type === "text") {
        text += node.text + " ";
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    };

    traverse(content);
    return text.trim().slice(0, 150);
  };

  // Calculate word count
  const getWordCount = (content: any): number => {
    const preview = getPreview(content);
    return preview ? preview.split(/\s+/).length : 0;
  };

  // Format relative time
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Call onDelete callback
      if (onDelete) {
        onDelete(document.id);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleClick = () => {
    router.push(`/dashboard/documents/${document.id}`);
  };

  const preview = getPreview(document.content);
  const wordCount = getWordCount(document.content);
  const relativeTime = getRelativeTime(document.updated_at);

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-flexoki-ui border border-flexoki-ui-3 rounded-lg p-6 max-w-md mx-4 animate-scale-in">
            <h3 className="text-lg font-semibold text-flexoki-tx mb-2">
              Delete Document?
            </h3>
            <p className="text-flexoki-tx-2 mb-4">
              This will permanently delete "{document.title}". This action
              cannot be undone.
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

      {/* Card */}
      <div className="bg-flexoki-ui rounded-lg shadow-md hover:shadow-lg transition-all group relative overflow-hidden">
        {/* Clickable area */}
        <div
          onClick={handleClick}
          className="cursor-pointer p-6 hover:bg-flexoki-ui-2 transition-colors"
        >
          {/* Title */}
          <h3 className="text-xl font-semibold text-flexoki-tx mb-2 line-clamp-2 group-hover:text-flexoki-accent transition-colors">
            {document.title}
          </h3>

          {/* Preview */}
          <p className="text-flexoki-tx-2 text-sm mb-4 line-clamp-3">
            {preview || "Empty document"}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-flexoki-tx-3">
            <span>{relativeTime}</span>
            <span>{wordCount} words</span>
          </div>

          {/* Linked capture indicator */}
          {document.captures && (
            <div className="mt-3 pt-3 border-t border-flexoki-ui-3">
              <div className="flex items-center gap-2 text-xs text-flexoki-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
                <span>From voice note</span>
              </div>
            </div>
          )}
        </div>

        {/* Delete button (positioned in corner) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          className="absolute top-4 right-4 p-2 rounded-lg text-flexoki-tx-3 hover:text-red-600 hover:bg-flexoki-ui-2 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete document"
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
    </>
  );
}
