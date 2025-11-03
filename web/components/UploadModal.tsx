"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Upload, Image as ImageIcon, Video, Plus, Trash2 } from "lucide-react";

interface UploadFile {
  file: File;
  preview: string;
  caption: string;
  tags: string[];
  newTag: string;
  uploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function UploadModal({
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newFiles: UploadFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
      tags: [],
      newTag: "",
      uploading: false,
      progress: 0,
      error: null,
    }));

    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setUploadFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(uploadFiles[index].preview);
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = (index: number) => {
    const file = uploadFiles[index];
    const trimmedTag = file.newTag.trim();
    if (trimmedTag && !file.tags.includes(trimmedTag)) {
      updateFile(index, {
        tags: [...file.tags, trimmedTag],
        newTag: "",
      });
    }
  };

  const removeTag = (fileIndex: number, tagIndex: number) => {
    const file = uploadFiles[fileIndex];
    updateFile(fileIndex, {
      tags: file.tags.filter((_, i) => i !== tagIndex),
    });
  };

  const handleUploadAll = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not authenticated");
      setUploading(false);
      return;
    }

    for (let i = 0; i < uploadFiles.length; i++) {
      const uploadFile = uploadFiles[i];

      try {
        updateFile(i, { uploading: true, progress: 0 });

        // Generate unique filename
        const fileExt = uploadFile.file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("media-items")
          .upload(fileName, uploadFile.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (storageError) {
          throw storageError;
        }

        updateFile(i, { progress: 50 });

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media-items").getPublicUrl(fileName);

        // Determine file type
        const fileType = uploadFile.file.type.startsWith("video/") ? "video" : "image";

        // Create database entry
        const { error: dbError } = await supabase.from("media_items").insert({
          user_id: user.id,
          file_url: publicUrl,
          file_type: fileType,
          caption: uploadFile.caption.trim() || null,
          tags: uploadFile.tags.length > 0 ? uploadFile.tags : null,
          original_date: new Date().toISOString().split("T")[0],
          log_date: new Date().toISOString().split("T")[0],
        });

        if (dbError) {
          throw dbError;
        }

        updateFile(i, { progress: 100, uploading: false });
      } catch (error: any) {
        console.error("Upload error:", error);
        updateFile(i, {
          uploading: false,
          error: error.message || "Upload failed",
        });
      }
    }

    setUploading(false);

    // Check if all uploads completed successfully
    const allSuccess = uploadFiles.every((f) => !f.error);
    if (allSuccess) {
      onUploadComplete();
      onClose();
    }
  };

  const isFileImage = (file: File) => file.type.startsWith("image/");
  const isFileVideo = (file: File) => file.type.startsWith("video/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={uploading ? undefined : onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 my-8 flex flex-col bg-flexoki-bg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-flexoki-ui border-b border-flexoki-ui-3">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-flexoki-accent" />
            <h2 className="text-xl font-bold text-flexoki-tx">Upload Media</h2>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-flexoki-ui-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-flexoki-tx" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {uploadFiles.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-flexoki-tx-3 mx-auto mb-4" />
              <p className="text-flexoki-tx-2 mb-4">
                No files selected. Click below to choose files.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg hover:opacity-90 transition-opacity"
              >
                Select Files
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {uploadFiles.map((uploadFile, index) => (
                <div
                  key={index}
                  className="bg-flexoki-ui rounded-lg p-4 border border-flexoki-ui-3"
                >
                  <div className="flex gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0 w-32 h-32 bg-flexoki-ui-2 rounded overflow-hidden">
                      {isFileImage(uploadFile.file) ? (
                        <img
                          src={uploadFile.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : isFileVideo(uploadFile.file) ? (
                        <video
                          src={uploadFile.preview}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-flexoki-tx-3" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-flexoki-tx">
                            {uploadFile.file.name}
                          </p>
                          <p className="text-sm text-flexoki-tx-2">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="p-1 hover:bg-flexoki-ui-2 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>

                      {/* Caption Input */}
                      <div>
                        <label className="block text-sm font-medium text-flexoki-tx-2 mb-1">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={uploadFile.caption}
                          onChange={(e) =>
                            updateFile(index, { caption: e.target.value })
                          }
                          placeholder="Add a caption..."
                          disabled={uploading}
                          className="w-full px-3 py-2 bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent disabled:opacity-50"
                        />
                      </div>

                      {/* Tags Input */}
                      <div>
                        <label className="block text-sm font-medium text-flexoki-tx-2 mb-1">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {uploadFile.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-flexoki-accent/20 text-flexoki-accent rounded text-sm"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(index, tagIndex)}
                                disabled={uploading}
                                className="hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={uploadFile.newTag}
                            onChange={(e) =>
                              updateFile(index, { newTag: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addTag(index);
                              }
                            }}
                            placeholder="Add a tag..."
                            disabled={uploading}
                            className="flex-1 px-3 py-2 bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent disabled:opacity-50"
                          />
                          <button
                            onClick={() => addTag(index)}
                            disabled={uploading || !uploadFile.newTag.trim()}
                            className="px-3 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress/Error */}
                      {uploadFile.uploading && (
                        <div className="space-y-1">
                          <div className="w-full bg-flexoki-ui-3 rounded-full h-2">
                            <div
                              className="bg-flexoki-accent h-2 rounded-full transition-all"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-flexoki-tx-2">
                            Uploading... {uploadFile.progress}%
                          </p>
                        </div>
                      )}
                      {uploadFile.error && (
                        <p className="text-sm text-red-500">{uploadFile.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-flexoki-ui border-t border-flexoki-ui-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-flexoki-ui-2 hover:bg-flexoki-ui-3 text-flexoki-tx rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add More Files</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-flexoki-tx-2 hover:text-flexoki-tx transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadAll}
              disabled={uploading || uploadFiles.length === 0}
              className="px-6 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? "Uploading..." : `Upload ${uploadFiles.length} ${uploadFiles.length === 1 ? "File" : "Files"}`}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
