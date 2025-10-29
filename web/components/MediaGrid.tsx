"use client";

import { Trash2 } from "lucide-react";

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

interface MediaGridProps {
  mediaItems: MediaItem[];
  onDelete?: (itemId: string) => void;
  onMediaClick?: (item: MediaItem) => void;
}

export default function MediaGrid({
  mediaItems,
  onDelete,
  onMediaClick,
}: MediaGridProps) {
  const formatDate = (dateString: string | null, fallback: string) => {
    const base = dateString || fallback;
    if (!base) return "Unknown date";
    const d = new Date(base + (base.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          className="group relative bg-flexoki-ui-2 rounded-lg overflow-hidden shadow border border-flexoki-ui-3 cursor-pointer hover:border-flexoki-accent transition-colors"
          onClick={() => onMediaClick?.(item)}
        >
          <div className="aspect-square overflow-hidden">
            {/* Using img instead of Next/Image to avoid remote domain config issues */}
            <img
              src={item.file_url}
              alt={item.caption || "media item"}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                // Fallback to a generic file icon if image format isn't supported (e.g., HEIC)
                img.src = "/file.svg";
                img.className = "h-full w-full object-contain p-6 opacity-80";
              }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white">
            <p className="text-xs opacity-80">
              {formatDate(item.original_date, item.created_at.split("T")[0])}
            </p>
            {item.caption && (
              <p className="text-sm truncate mt-1">{item.caption}</p>
            )}
          </div>

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
