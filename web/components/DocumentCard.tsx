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
  is_focused: boolean;
  captures?: Capture | null;
};

type DocumentCardProps = {
  document: Document;
  onDelete?: (id: string) => void;
  onFocusToggle?: () => void;
};

export default function DocumentCard({ document, onDelete, onFocusToggle }: DocumentCardProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(document.is_focused);
  const [isTogglingFocus, setIsTogglingFocus] = useState(false);

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

  // Extract all text from Tiptap JSON (for word count)
  const getAllText = (content: any): string => {
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
    return text.trim();
  };

  // Calculate word count (excludes emojis and counts only actual words)
  const getWordCount = (content: any): number => {
    const allText = getAllText(content);
    if (!allText) return 0;

    // Remove emojis and other non-word characters, then split by whitespace
    const cleanedText = allText
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Remove misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Remove dingbats
      .trim();

    return cleanedText ? cleanedText.split(/\s+/).filter(word => word.length > 0).length : 0;
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

  const handleToggleFocus = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setIsTogglingFocus(true);

    try {
      const newFocusState = !isFocused;

      const response = await fetch(`/api/documents/${document.id}/focus`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_focused: newFocusState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update focus state");
      }

      // Update local state
      setIsFocused(newFocusState);

      // Call callback to refresh parent list
      if (onFocusToggle) {
        onFocusToggle();
      }
    } catch (error) {
      console.error("Error toggling focus:", error);
      alert("Failed to update focus state");
    } finally {
      setIsTogglingFocus(false);
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
      <div className={`bg-flexoki-ui rounded-lg shadow-md hover:shadow-lg transition-all group relative overflow-hidden ${
        isFocused ? 'ring-2 shadow-[rgb(58,169,159)]/20' : ''
      }`}
      style={isFocused ? { borderColor: 'rgb(58, 169, 159)', borderWidth: '2px', borderStyle: 'solid' } : {}}
      >
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

        {/* Focus button (positioned in corner) */}
        <button
          onClick={handleToggleFocus}
          disabled={isTogglingFocus}
          className={`absolute top-4 right-14 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 ${
            isFocused
              ? 'text-flexoki-accent bg-flexoki-accent/10'
              : 'text-flexoki-tx-3 hover:text-flexoki-accent hover:bg-flexoki-ui-2'
          }`}
          title={isFocused ? "Remove focus" : "Focus on this document"}
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

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
