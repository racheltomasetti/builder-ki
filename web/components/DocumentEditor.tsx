"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  user_id: string;
  capture_id: string | null;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
};

type DocumentEditorProps = {
  document: Document;
};

export default function DocumentEditor({ document }: DocumentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your thoughts...",
      }),
    ],
    content: document.content,
    onUpdate: ({ editor }) => {
      // Trigger debounced auto-save
      handleContentChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-flexoki max-w-none focus:outline-none min-h-[500px] px-4 py-2",
      },
    },
  });

  const saveDocument = async (updates: {
    title?: string;
    content?: any;
  }) => {
    setSaveStatus("saving");

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Error saving document:", error);
      setSaveStatus("error");
    }
  };

  const handleContentChange = useCallback(
    (content: any) => {
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save (1 second debounce)
      const timeout = setTimeout(() => {
        saveDocument({ content });
      }, 1000);

      setSaveTimeout(timeout);
    },
    [saveTimeout]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(() => {
      saveDocument({ title: newTitle });
    }, 1000);

    setSaveTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  return (
    <div className="min-h-screen bg-flexoki-bg">
      {/* Header */}
      <div className="bg-flexoki-ui border-b border-flexoki-ui-3">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="text-flexoki-tx-2 hover:text-flexoki-tx transition-colors flex items-center gap-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Documents
          </button>

          {/* Save Status */}
          <div className="flex items-center gap-2 text-sm text-flexoki-tx-3">
            {saveStatus === "saving" && (
              <>
                <span className="animate-pulse">●</span>
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="text-green-500">✓</span>
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="text-red-500">✗</span>
                <span>Error saving</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-4xl font-bold bg-transparent border-none text-flexoki-tx focus:outline-none w-full mb-6 placeholder-flexoki-tx-3"
          placeholder="Untitled Document"
        />

        {/* Editor Toolbar */}
        {editor && (
          <div className="mb-4 flex gap-2 pb-4 border-b border-flexoki-ui-3">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("bold")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("italic")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Italic
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              H2
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("bulletList")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Bullet List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive("orderedList")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Numbered List
            </button>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
