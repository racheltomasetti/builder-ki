"use client";

import { useState, useEffect } from "react";
import DocumentCard from "./DocumentCard";

type Capture = {
  id: string;
  transcription: string | null;
  created_at: string;
  file_url: string;
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

type DocumentsListProps = {
  initialDocuments: Document[];
};

export default function DocumentsList({
  initialDocuments,
}: DocumentsListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [focusMode, setFocusMode] = useState(false);

  // Filter documents based on focus mode
  const filteredDocuments = focusMode
    ? documents.filter((doc) => doc.is_focused)
    : documents;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to exit focus mode
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }

      // Ctrl+F+Enter to enter focus mode (when not already in focus mode)
      if (e.ctrlKey && e.key === "f" && !focusMode) {
        e.preventDefault(); // Prevent browser's default find dialog
        // Set a flag to wait for Enter key
        sessionStorage.setItem("waitingForFocusEnter", "true");
      }

      // Enter key after Ctrl+F to activate focus mode
      if (
        e.key === "Enter" &&
        sessionStorage.getItem("waitingForFocusEnter") === "true"
      ) {
        e.preventDefault();
        setFocusMode(true);
        sessionStorage.removeItem("waitingForFocusEnter");
      }

      // Clear the flag if any other key is pressed
      if (
        e.key !== "f" &&
        e.key !== "Enter" &&
        sessionStorage.getItem("waitingForFocusEnter")
      ) {
        sessionStorage.removeItem("waitingForFocusEnter");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      sessionStorage.removeItem("waitingForFocusEnter");
    };
  }, [focusMode]);

  const handleDelete = (deletedId: string) => {
    // Remove deleted document from state
    setDocuments((prev) => prev.filter((doc) => doc.id !== deletedId));
  };

  const handleFocusToggle = (documentId: string, newFocusState: boolean) => {
    // Optimistically update the document's focus state in local state
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId ? { ...doc, is_focused: newFocusState } : doc
      )
    );
  };

  const handleCreateNew = async () => {
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Untitled Document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [],
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const newDocument = await response.json();

      // Navigate to new document
      window.location.href = `/dashboard/documents/${newDocument.id}`;
    } catch (error) {
      console.error("Error creating document:", error);
      alert("Failed to create new document");
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flexoki-tx mb-2">
            {focusMode ? "FOCUS" : "Documents"}
          </h1>
          <p className="text-flexoki-tx-2">
            {focusMode
              ? `${filteredDocuments.length} focused ${
                  filteredDocuments.length === 1 ? "document" : "documents"
                }`
              : `${documents.length} ${
                  documents.length === 1 ? "document" : "documents"
                }`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-xl font-bold ${
              focusMode
                ? "bg-flexoki-ui-2 text-flexoki-tx-2 hover:bg-flexoki-ui-3 hover:text-2xl"
                : "bg-flexoki-accent opacity-90 text-white border border-flexoki-ui-3 hover:bg-flexoki-accent hover:opacity-100 hover:text-2xl"
            }`}
          >
            {focusMode ? (
              <>
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                All Documents
              </>
            ) : (
              <>· FOCUS ·</>
            )}
          </button>
          {/* New Document Button */}
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-flexoki-accent-2 opacity-90 text-white text-xl font-bold rounded-lg hover:opacity-100 hover:text-2xl transition-colors flex items-center gap-2"
          >
            ~ CREATE ~
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            {focusMode ? (
              // Empty state for focus mode with no focused documents
              <>
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-xl font-semibold text-flexoki-tx mb-2">
                  No focused documents
                </h2>
                <p className="text-flexoki-tx-2 mb-6">
                  Click the target icon on any document to focus on it.
                </p>
                <button
                  onClick={() => setFocusMode(false)}
                  className="px-6 py-3 bg-flexoki-ui-2 text-flexoki-tx rounded-lg hover:bg-flexoki-ui-3 transition-colors inline-flex items-center gap-2 border border-flexoki-ui-3"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  View All Documents
                </button>
              </>
            ) : (
              // Empty state for no documents at all
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-flexoki-tx-3 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-flexoki-tx mb-2">
                  No documents yet
                </h2>
                <p className="text-flexoki-tx-2 mb-6">
                  Expand a voice note to create your first document, or create a
                  blank one.
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-flexoki-accent text-white rounded-lg hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create New Document
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
                onFocusToggle={handleFocusToggle}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
