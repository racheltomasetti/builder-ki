"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Image as ImageIcon } from "lucide-react";

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

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
  onMediaSelect: (url: string) => void;
}

export default function MediaLibrary({
  isOpen,
  onClose,
  panelWidth,
  onWidthChange,
  onMediaSelect,
}: MediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchMediaItems();
    }
  }, [isOpen]);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .order("original_date", { ascending: false });

      if (error) {
        console.error("Error fetching media:", error);
        return;
      }

      setMediaItems(data || []);
    } catch (err: any) {
      console.error("Error fetching media items:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedia = mediaItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    return (
      (item.caption || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  });

  const getDisplayDate = (item: MediaItem) => {
    const date = item.original_date || item.log_date || item.created_at.split("T")[0];
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          onWidthChange(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full bg-flexoki-bg border-l border-flexoki-ui-3 shadow-2xl z-50 flex flex-col animate-slide-in-right"
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-flexoki-accent transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-flexoki-ui-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-flexoki-accent" />
            <h2 className="text-lg font-semibold text-flexoki-tx">
              Media Library
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-flexoki-tx-2 hover:text-flexoki-tx hover:bg-flexoki-ui-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-flexoki-ui-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-flexoki-tx-3" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search media..."
              className="block w-full pl-9 pr-4 py-2 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-sm text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-flexoki-accent mx-auto mb-2"></div>
                <p className="text-sm text-flexoki-tx-2">Loading...</p>
              </div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-flexoki-tx-3 mx-auto mb-2" />
                <p className="text-sm text-flexoki-tx-2">
                  {searchQuery ? "No media found" : "No media uploaded yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredMedia.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onMediaSelect(item.file_url)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-flexoki-ui-2 hover:ring-2 hover:ring-flexoki-accent transition-all"
                >
                  <img
                    src={item.file_url}
                    alt={item.caption || "Media"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-xs text-white font-medium truncate">
                      {getDisplayDate(item)}
                    </p>
                    {item.caption && (
                      <p className="text-xs text-white/80 truncate">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-flexoki-ui-3 bg-flexoki-ui">
          <p className="text-xs text-flexoki-tx-3 text-center">
            Click any image to insert it into your document
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
