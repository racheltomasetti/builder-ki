"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FileHandler } from "@tiptap/extension-file-handler";
import ImageResize from "tiptap-extension-resize-image";
import { Extension } from "@tiptap/core";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import ThinkingPartner from "./ThinkingPartner";
import MediaLibrary from "./MediaLibrary";
import { VoiceCaptureNode } from "./VoiceCaptureNode";

type Insight = {
  id: string;
  type: "insight" | "decision" | "question" | "concept";
  content: string;
  created_at: string;
};

type Capture = {
  id: string;
  transcription: string | null;
  created_at: string;
  file_url: string;
  insights?: Insight[];
};

type Document = {
  id: string;
  user_id: string;
  capture_id: string | null;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  captures?: Capture | null;
};

type DocumentEditorProps = {
  document: Document;
};

// Custom extension to delete line on Ctrl+X when no text is selected
const DeleteLine = Extension.create({
  name: "deleteLine",

  addKeyboardShortcuts() {
    return {
      "Mod-x": ({ editor }) => {
        const { from, to } = editor.state.selection;

        // Only delete line if nothing is selected (cursor position)
        if (from === to) {
          const $from = editor.state.doc.resolve(from);
          const start = $from.start($from.depth);
          const end = $from.end($from.depth);

          // Delete the entire node/line
          editor.commands.deleteRange({ from: start, to: end });
          return true; // Prevent default behavior
        }

        // If text is selected, allow default cut behavior
        return false;
      },
    };
  },
});

export default function DocumentEditor({ document }: DocumentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isThinkingPartnerOpen, setIsThinkingPartnerOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400); // Default width for ThinkingPartner
  const [mediaLibraryWidth, setMediaLibraryWidth] = useState(500); // Default width for MediaLibrary
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);
  const [isPublic, setIsPublic] = useState(document.is_public);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
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
      StarterKit.configure({
        bold: {
          // Allow bold to coexist with other marks like color
          HTMLAttributes: {
            class: "font-bold",
          },
        },
      }),
      DeleteLine,
      VoiceCaptureNode,
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
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
        autocorrect: "off",
        autocapitalize: "off",
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

  // Ctrl+Shift+Enter to toggle Thinking Partner
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

  // Ctrl+Shift+M to toggle Media Library
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "M") {
        event.preventDefault();
        setIsMediaLibraryOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle media selection from library
  const handleMediaSelect = (url: string) => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "imageResize",
        attrs: { src: url },
      })
      .run();

    // Optionally close the media library after insertion
    setIsMediaLibraryOpen(false);
  };

  // Handle voice capture selection from library
  const handleVoiceCaptureSelect = (captureId: string) => {
    if (!editor) return;

    editor.chain().focus().setVoiceCapture({ captureId }).run();

    // Optionally close the media library after insertion
    setIsMediaLibraryOpen(false);
  };

  // Handle toggling public/private state
  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);

    const newPublicState = !isPublic;

    try {
      // Optimistically update local state
      setIsPublic(newPublicState);

      // Call API to update public state
      const response = await fetch(`/api/documents/${document.id}/public`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_public: newPublicState }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setIsPublic(!newPublicState);
        throw new Error("Failed to update public state");
      }
    } catch (error) {
      console.error("Error toggling public state:", error);
      alert("Failed to update public state");
      // Revert optimistic update
      setIsPublic(!newPublicState);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-flexoki-bg transition-all duration-300"
      style={{
        paddingRight: isThinkingPartnerOpen
          ? panelWidth
          : isMediaLibraryOpen
          ? mediaLibraryWidth
          : 0,
      }}
    >
      {/* Header */}
      <div className="bg-flexoki border-b border-flexoki-ui-3">
        <div className="relative px-6 py-4">
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

        {/* Audio Player and Transcription - only show if document has a linked capture */}
        {document.captures && document.captures.file_url && (
          <div className="px-6 pb-4">
            <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg overflow-hidden">
              {/* Header with Audio Player */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-flexoki-accent"
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
                    <span className="text-sm text-flexoki-accent font-medium">
                      Seed of Thought
                    </span>
                  </div>
                  {/* Toggle button for transcription */}
                  {document.captures.transcription && (
                    <button
                      onClick={() =>
                        setIsTranscriptionExpanded(!isTranscriptionExpanded)
                      }
                      className="flex items-center gap-2 px-3 py-1 rounded text-xs text-flexoki-tx-2 hover:text-flexoki-tx hover:bg-flexoki-ui-3 transition-colors"
                    >
                      <span>
                        {isTranscriptionExpanded ? "Hide" : "View"}{" "}
                        Transcription
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${
                          isTranscriptionExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <audio controls className="w-full h-8">
                  <source src={document.captures.file_url} type="audio/m4a" />
                  <source src={document.captures.file_url} type="audio/mp3" />
                  <source src={document.captures.file_url} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>

              {/* Expandable Transcription and Insights */}
              {isTranscriptionExpanded && document.captures.transcription && (
                <div className="border-t border-flexoki-ui-3 p-4 bg-flexoki-ui animate-fade-in">
                  {/* Transcription */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-flexoki-tx mb-2">
                      Transcription
                    </h4>
                    <p className="text-flexoki-tx text-sm leading-relaxed">
                      {document.captures.transcription}
                    </p>
                  </div>

                  {/* Insights */}
                  {document.captures.insights &&
                    document.captures.insights.length > 0 && (
                      <div className="pt-3 border-t border-flexoki-ui-3">
                        <h4 className="text-sm font-semibold text-flexoki-tx mb-3">
                          Extracted Insights (
                          {document.captures.insights.length})
                        </h4>
                        <div className="space-y-2">
                          {document.captures.insights.map((insight) => (
                            <div
                              key={insight.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-base leading-none">
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Back button and Share button - below header and voice note */}
      <div className="px-6 pt-6 flex justify-between items-center">
        {/* Back button - left aligned */}
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
        </button>

        {/* Share button - right aligned */}
        <button
          onClick={handleTogglePublic}
          disabled={isTogglingPublic}
          className={`px-4 py-2 text-3xl rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
            isPublic
              ? "bg-flexoki-accent-2 text-white hover:text-3xl hover:italic hover:font-bold"
              : "bg-flexoki-accent font-bold text-flexoki-tx hover:text-3xl hover:italic hover:font-bold hover:bg-flexoki-accent-2"
          }`}
          title={
            isPublic
              ? "document is public - click to make private"
              : "document is private - click to share"
          }
        >
          {isPublic ? (
            <>
              <span>{isTogglingPublic ? "Updating..." : "Public"}</span>
            </>
          ) : (
            <>
              <span>{isTogglingPublic ? "Updating..." : "SHARE"}</span>
            </>
          )}
        </button>
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-6xl font-bold bg-transparent border-none text-flexoki-tx focus:outline-none w-full mb-6 placeholder-flexoki-tx-3 leading-tight"
          placeholder="to be named..."
          style={{ lineHeight: "2.2" }}
        />

        {/* Editor Toolbar */}
        {editor && (
          <div className="sticky top-0 z-10 bg-flexoki-bg mb-4 flex gap-2 pb-4 border-b border-flexoki-ui-3 flex-wrap shadow-sm">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                editor.isActive("bold")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                editor.isActive("italic")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Italic
            </button>

            {/* Separator */}
            <div className="mt-3 w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            {/* Color Buttons */}
            <button
              onClick={() => editor.chain().focus().setColor("#af3029").run()}
              className={`mt-3 px-3 py-1 rounded text-sm flex items-center gap-1 ${
                editor.getAttributes("textStyle").color === "#af3029"
                  ? "bg-flexoki-ui-3 ring-2 ring-[#af3029]"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
              title="Accent Color"
            >
              <div
                className="w-4 h-4 rounded border border-flexoki-ui-3"
                style={{ backgroundColor: "#af3029" }}
              ></div>
            </button>
            <button
              onClick={() => editor.chain().focus().setColor("#24837b").run()}
              className={`mt-3 px-3 py-1 rounded text-sm flex items-center gap-1 ${
                editor.getAttributes("textStyle").color === "#24837b"
                  ? "bg-flexoki-ui-3 ring-2 ring-[#24837b]"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
              title="Accent 2 Color"
            >
              <div
                className="w-4 h-4 rounded border border-flexoki-ui-3"
                style={{ backgroundColor: "#24837b" }}
              ></div>
            </button>
            <button
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-3 px-3 py-1 rounded text-sm bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3 transition-colors"
              title="Clear Color"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Separator */}
            <div className="mt-3 w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`mt-3 px-3 py-1 rounded text-sm ${
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
              className={`mt-3 px-3 py-1 rounded text-sm ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                editor.isActive("bulletList")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Bullet List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                editor.isActive("orderedList")
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors`}
            >
              Numbered List
            </button>

            {/* Separator */}
            <div className="mt-3 w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            {/* Alignment Buttons */}
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`mt-3 px-3 py-1 rounded text-sm ${
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
              className={`mt-3 px-3 py-1 rounded text-sm ${
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
              className={`mt-3 px-3 py-1 rounded text-sm ${
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
            <div className="mt-3 w-px h-6 bg-flexoki-ui-3 mx-1"></div>

            {/* Image Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className={`mt-3 px-3 py-1 rounded text-sm ${
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

            {/* Media Library Button */}
            <button
              onClick={() => setIsMediaLibraryOpen(!isMediaLibraryOpen)}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                isMediaLibraryOpen
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors flex items-center gap-1`}
              title="Open Media Library (Ctrl+Shift+M)"
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Library
            </button>

            {/* Thinking Partner Button */}
            <button
              onClick={() => setIsThinkingPartnerOpen(!isThinkingPartnerOpen)}
              className={`mt-3 px-3 py-1 rounded text-sm ${
                isThinkingPartnerOpen
                  ? "bg-flexoki-accent text-white"
                  : "bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3"
              } transition-colors flex items-center gap-1`}
              title="Open Thinking Partner (Ctrl+Shift+Enter)"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Agent
            </button>
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

      {/* Media Library Slide-out Panel */}
      <MediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        panelWidth={mediaLibraryWidth}
        onWidthChange={setMediaLibraryWidth}
        onMediaSelect={handleMediaSelect}
        onVoiceCaptureSelect={handleVoiceCaptureSelect}
      />
    </div>
  );
}
