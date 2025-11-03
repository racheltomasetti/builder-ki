"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
// Using standard img to avoid Next/Image remote optimization issues in modal
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Tag,
  ExternalLink,
  Edit2,
  Save,
  XCircle,
} from "lucide-react";

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  original_date: string | null;
  log_date: string | null;
  caption: string | null;
  tags: string[] | null;
  metadata: any;
  created_at: string;
};

interface MediaModalProps {
  mediaItem: MediaItem;
  onClose: () => void;
  allMedia: MediaItem[];
  onNavigate: (item: MediaItem) => void;
  onUpdate?: () => void;
}

export default function MediaModal({
  mediaItem,
  onClose,
  allMedia,
  onNavigate,
  onUpdate,
}: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // Find current index in the filtered media array
  useEffect(() => {
    const index = allMedia.findIndex((item) => item.id === mediaItem.id);
    setCurrentIndex(index >= 0 ? index : 0);
  }, [mediaItem.id, allMedia]);

  const currentItem = allMedia[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  // Reset edit state when currentItem changes
  useEffect(() => {
    setIsEditing(false);
    setEditedCaption(currentItem?.caption || "");
    setEditedTags(currentItem?.tags || []);
    setNewTag("");
  }, [currentItem?.id]);

  const navigateToPrevious = () => {
    if (hasPrevious) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate(allMedia[newIndex]);
    }
  };

  const navigateToNext = () => {
    if (hasNext) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate(allMedia[newIndex]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && hasPrevious) navigateToPrevious();
    if (e.key === "ArrowRight" && hasNext) navigateToNext();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasPrevious, hasNext]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDisplayDate = (item: MediaItem) => {
    return item.original_date || item.log_date || item.created_at.split("T")[0];
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentItem.file_url;
    link.download = `media-${currentItem.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      console.log("Saving media item:", {
        id: currentItem.id,
        caption: editedCaption.trim() || null,
        tags: editedTags.length > 0 ? editedTags : null,
      });

      const { data, error } = await supabase
        .from("media_items")
        .update({
          caption: editedCaption.trim() || null,
          tags: editedTags.length > 0 ? editedTags : null,
        })
        .eq("id", currentItem.id)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Save successful:", data);

      // Update the local item
      currentItem.caption = editedCaption.trim() || null;
      currentItem.tags = editedTags.length > 0 ? editedTags : null;

      // Notify parent to refresh data
      if (onUpdate) {
        onUpdate();
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving media item:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedCaption(currentItem?.caption || "");
    setEditedTags(currentItem?.tags || []);
    setNewTag("");
    setIsEditing(false);
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editedTags.includes(trimmedTag)) {
      setEditedTags([...editedTags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-6xl h-[90vh] mx-4 my-8 flex flex-col bg-black rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 text-white">
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/80">
              {currentIndex + 1} of {allMedia.length}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(getDisplayDate(currentItem))}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-2 bg-flexoki-accent hover:bg-flexoki-accent/90 text-flexoki-bg rounded-lg transition-colors disabled:opacity-50"
                  title="Save changes"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isSaving ? "Saving..." : "Save"}
                  </span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel editing"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Edit caption and tags"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => window.open(currentItem.file_url, "_blank")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-0">
          {currentItem.file_type === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                key={currentItem.id}
                src={currentItem.file_url}
                alt={currentItem.caption || "Media item"}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.src = "/file.svg";
                  img.className =
                    "max-w-full max-h-full object-contain p-12 opacity-80";
                }}
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <video
                key={currentItem.id}
                src={currentItem.file_url}
                className="max-w-full max-h-full"
                controls
                autoPlay
              />
            </div>
          )}

          {/* Navigation Arrows */}
          {hasPrevious && (
            <button
              onClick={navigateToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
              title="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={navigateToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
              title="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-black/50 text-white">
          {/* Caption Section */}
          <div className="mb-3">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium mb-1 text-white/80">
                  Caption
                </label>
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            ) : (
              currentItem.caption && (
                <p className="text-lg font-medium">{currentItem.caption}</p>
              )
            )}
          </div>

          {/* Tags Section */}
          <div className="mb-3">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium mb-1 text-white/80">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {editedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                    className="px-4 py-2 bg-flexoki-accent hover:bg-flexoki-accent/90 text-flexoki-bg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              currentItem.tags &&
              currentItem.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-white/80" />
                  <div className="flex flex-wrap gap-1">
                    {currentItem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white/10 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="text-sm text-white/80">
            <p>Uploaded: {new Date(currentItem.created_at).toLocaleString()}</p>
            <p>Type: {currentItem.file_type.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
