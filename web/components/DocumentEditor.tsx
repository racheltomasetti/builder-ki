"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { FileHandler } from "@tiptap/extension-file-handler";
import ImageResize from "tiptap-extension-resize-image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import ThinkingPartner from "./ThinkingPartner";

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isThinkingPartnerOpen, setIsThinkingPartnerOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400); // Default width for ThinkingPartner
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Supabase client using the proper helper
  const supabase = createClient();

  // Image upload handler with compression
  const uploadImage = async (file: File): Promise<string> => {
    try {
      setIsUploadingImage(true);
      console.log("Starting upload for file:", file.name, "Type:", file.type);

      // Compress image
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as any,
      };

      console.log("Compressing image...");
      const compressedFile = await imageCompression(file, options);
      console.log("Compressed file size:", compressedFile.size, "bytes");

      // Generate unique filename
      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${document.id}/${Date.now()}.${fileExt}`;
      console.log("Uploading to path:", fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("photos")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        alert(`Upload failed: ${error.message}`);
        throw error;
      }

      console.log("Upload successful:", data);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName);

      console.log("Public URL:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your thoughts...",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      ImageResize.configure({
        inline: false,
        allowBase64: false,
      }),
      FileHandler.configure({
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif",
          "image/webp",
        ],
        onDrop: (currentEditor, files, pos) => {
          console.log("Files dropped:", files);
          files.forEach(async (file) => {
            if (file.type.startsWith("image/")) {
              try {
                console.log("Processing image drop:", file.name);
                const url = await uploadImage(file);
                currentEditor
                  .chain()
                  .insertContentAt(pos, {
                    type: "imageResize",
                    attrs: { src: url },
                  })
                  .focus()
                  .run();
              } catch (error) {
                console.error("Error dropping image:", error);
              }
            }
          });
          return true;
        },
        onPaste: (currentEditor, files) => {
          console.log("Files pasted:", files);
          files.forEach(async (file) => {
            if (file.type.startsWith("image/")) {
              try {
                console.log("Processing image paste:", file.name);
                const url = await uploadImage(file);
                currentEditor
                  .chain()
                  .insertContent({
                    type: "imageResize",
                    attrs: { src: url },
                  })
                  .focus()
                  .run();
              } catch (error) {
                console.error("Error pasting image:", error);
              }
            }
          });
          return true;
        },
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

  const saveDocument = async (updates: { title?: string; content?: any }) => {
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

  // Handle manual image upload from toolbar
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || !editor) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadImage(file);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageResize",
            attrs: { src: url },
          })
          .run();
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // ESC key to return to documents list
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.push("/dashboard/documents");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Ctrl++Shift+Enter to toggle Thinking Partner
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        setIsThinkingPartnerOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen bg-flexoki-bg transition-all duration-300"
      style={{ paddingRight: isThinkingPartnerOpen ? panelWidth : 0 }}
    >
      {/* Header */}
      <div className="bg-flexoki border-b border-flexoki-ui-3">
        <div className="relative px-6 py-4">
          {/* Back button - left aligned */}
          <button
            onClick={() => router.push("/dashboard/documents")}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-flexoki-tx-2 hover:text-flexoki-tx transition-colors flex items-center gap-2"
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
          </button>

          {/* Save Status - centered */}
          <div className="flex justify-center">
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
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-5xl font-bold bg-transparent border-none text-flexoki-tx focus:outline-none w-full mb-6 placeholder-flexoki-tx-3 leading-tight"
          placeholder="Untitled Document"
          style={{ lineHeight: "2.2" }}
        />

        {/* Editor Toolbar */}
        {editor && (
          <div className="mb-4 flex gap-2 pb-4 border-b border-flexoki-ui-3 flex-wrap">
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

            {/* Separator */}
            <div className="w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            {/* Alignment Buttons */}
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive({ textAlign: "left" })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
              title="Align Left"
            >
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
                  d="M4 6h16M4 12h10M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive({ textAlign: "center" })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
              title="Align Center"
            >
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
                  d="M4 6h16M7 12h10M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`px-3 py-1 rounded text-sm ${
                editor.isActive({ textAlign: "right" })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
              title="Align Right"
            >
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
                  d="M4 6h16M10 12h10M4 18h16"
                />
              </svg>
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            {/* Image Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className={`px-3 py-1 rounded text-sm ${
                isUploadingImage
                  ? "bg-flexoki-ui-2 text-flexoki-tx-3 cursor-not-allowed"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors flex items-center gap-1`}
            >
              {isUploadingImage ? (
                <>
                  <span className="animate-pulse">●</span>
                  Uploading...
                </>
              ) : (
                <>
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Image
                </>
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Thinking Partner Slide-out Panel */}
      <ThinkingPartner
        documentId={document.id}
        isOpen={isThinkingPartnerOpen}
        onClose={() => setIsThinkingPartnerOpen(false)}
        panelWidth={panelWidth}
        onWidthChange={setPanelWidth}
      />
    </div>
  );
}
