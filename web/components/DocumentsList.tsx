"use client";

import { useState } from "react";
import DocumentCard from "./DocumentCard";

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

type DocumentsListProps = {
  initialDocuments: Document[];
};

export default function DocumentsList({
  initialDocuments,
}: DocumentsListProps) {
  const [documents, setDocuments] = useState(initialDocuments);

  const handleDelete = (deletedId: string) => {
    // Remove deleted document from state
    setDocuments((prev) => prev.filter((doc) => doc.id !== deletedId));
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
          <h1 className="text-3xl font-bold text-flexoki-tx mb-2">Documents</h1>
          <p className="text-flexoki-tx-2">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-flexoki-accent text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
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
          New Document
        </button>
      </div>

      {/* Documents Grid */}
      <div>
        {documents.length === 0 ? (
          <div className="text-center py-12">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
