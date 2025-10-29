"use client";

import { useState, useEffect } from "react";
// Using standard img to avoid Next/Image remote optimization issues in modal
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Tag,
  ExternalLink,
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
}

export default function MediaModal({
  mediaItem,
  onClose,
  allMedia,
  onNavigate,
}: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current index in the filtered media array
  useEffect(() => {
    const index = allMedia.findIndex((item) => item.id === mediaItem.id);
    setCurrentIndex(index >= 0 ? index : 0);
  }, [mediaItem.id, allMedia]);

  const currentItem = allMedia[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

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

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 my-8 flex flex-col bg-black rounded-lg overflow-hidden">
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
          {currentItem.caption && (
            <p className="text-lg font-medium mb-2">{currentItem.caption}</p>
          )}

          {currentItem.tags && currentItem.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
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
          )}

          <div className="text-sm text-white/80">
            <p>Uploaded: {new Date(currentItem.created_at).toLocaleString()}</p>
            <p>Type: {currentItem.file_type.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
