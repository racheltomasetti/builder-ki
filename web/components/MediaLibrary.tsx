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

type VoiceCapture = {
  id: string;
  file_url: string;
  transcription: string | null;
  created_at: string;
};

type LibraryItem =
  | { type: "media"; data: MediaItem }
  | { type: "voice"; data: VoiceCapture };

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
  onMediaSelect: (url: string) => void;
  onVoiceCaptureSelect?: (captureId: string) => void;
}

export default function MediaLibrary({
  isOpen,
  onClose,
  panelWidth,
  onWidthChange,
  onMediaSelect,
  onVoiceCaptureSelect,
}: MediaLibraryProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"media" | "voice">("media");
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchLibraryItems();
    }
  }, [isOpen]);

  const fetchLibraryItems = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Fetch media items
      const { data: mediaData, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .order("original_date", { ascending: false });

      if (mediaError) {
        console.error("Error fetching media:", mediaError);
      }

      // Fetch voice captures
      const { data: capturesData, error: capturesError } = await supabase
        .from("captures")
        .select("id, file_url, transcription, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (capturesError) {
        console.error("Error fetching captures:", capturesError);
      }

      // Combine and sort by date
      const combined: LibraryItem[] = [
        ...(mediaData || []).map((item) => ({
          type: "media" as const,
          data: item,
        })),
        ...(capturesData || []).map((capture) => ({
          type: "voice" as const,
          data: capture,
        })),
      ];

      // Sort by creation date
      combined.sort((a, b) => {
        const dateA =
          a.type === "media"
            ? new Date(a.data.original_date || a.data.created_at)
            : new Date(a.data.created_at);
        const dateB =
          b.type === "media"
            ? new Date(b.data.original_date || b.data.created_at)
            : new Date(b.data.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setLibraryItems(combined);
    } catch (err: any) {
      console.error("Error fetching library items:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = libraryItems
    .filter((item) => {
      // Filter by active tab
      return item.type === activeTab;
    })
    .filter((item) => {
      // Filter by search query
      if (!searchQuery.trim()) return true;

      if (item.type === "media") {
        return (
          (item.data.caption || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (item.data.tags || []).some((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      } else {
        // Voice capture search
        return (item.data.transcription || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }
    });

  const mediaCount = libraryItems.filter(
    (item) => item.type === "media"
  ).length;
  const voiceCount = libraryItems.filter(
    (item) => item.type === "voice"
  ).length;

  const getDisplayDate = (item: LibraryItem) => {
    const date =
      item.type === "media"
        ? item.data.original_date ||
          item.data.log_date ||
          item.data.created_at.split("T")[0]
        : item.data.created_at;

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
              placeholder={`Search ${
                activeTab === "media" ? "photos & videos" : "voice notes"
              }...`}
              className="block w-full pl-9 pr-4 py-2 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-sm text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-flexoki-ui-3 bg-flexoki-ui">
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "media"
                ? "text-flexoki-accent"
                : "text-flexoki-tx-2 hover:text-flexoki-tx"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Photos & Videos</span>
              {mediaCount > 0 && (
                <span className="text-xs text-flexoki-tx-3">
                  ({mediaCount})
                </span>
              )}
            </div>
            {activeTab === "media" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-flexoki-accent"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "voice"
                ? "text-flexoki-accent"
                : "text-flexoki-tx-2 hover:text-flexoki-tx"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span>Voice Notes</span>
              {voiceCount > 0 && (
                <span className="text-xs text-flexoki-tx-3">
                  ({voiceCount})
                </span>
              )}
            </div>
            {activeTab === "voice" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-flexoki-accent"></div>
            )}
          </button>
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
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {activeTab === "media" ? (
                  <>
                    <ImageIcon className="w-12 h-12 text-flexoki-tx-3 mx-auto mb-2" />
                    <p className="text-sm text-flexoki-tx-2">
                      {searchQuery
                        ? "No photos or videos found"
                        : "No photos or videos uploaded yet"}
                    </p>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-12 h-12 text-flexoki-tx-3 mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    <p className="text-sm text-flexoki-tx-2">
                      {searchQuery
                        ? "No voice notes found"
                        : "No voice notes captured yet"}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : activeTab === "media" ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const mediaItem = item.type === "media" ? item.data : null;
                return (
                  <button
                    key={`media-${item.data.id}`}
                    onClick={() => {
                      if (item.type === "media") {
                        onMediaSelect(item.data.file_url);
                      }
                    }}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-flexoki-ui-2 hover:ring-2 hover:ring-flexoki-accent transition-all"
                  >
                    <img
                      src={item.data.file_url}
                      alt={mediaItem?.caption || "Media"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-xs text-white font-medium truncate">
                        {getDisplayDate(item)}
                      </p>
                      {mediaItem?.caption && (
                        <p className="text-xs text-white/80 truncate">
                          {mediaItem.caption}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <button
                  key={`voice-${item.data.id}`}
                  onClick={() => {
                    if (item.type === "voice") {
                      onVoiceCaptureSelect?.(item.data.id);
                    }
                  }}
                  className="w-full text-left bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-4 hover:border-flexoki-accent hover:bg-flexoki-ui-3 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-flexoki-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-flexoki-tx">
                          {getDisplayDate(item)}
                        </p>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-flexoki-tx-3 group-hover:text-flexoki-accent transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      {item.type === "voice" && item.data.transcription && (
                        <p className="text-sm text-flexoki-tx-2 line-clamp-2">
                          {item.data.transcription}
                        </p>
                      )}
                      {item.type === "voice" && !item.data.transcription && (
                        <p className="text-sm text-flexoki-tx-3 italic">
                          No transcription available
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-flexoki-ui-3 bg-flexoki-ui">
          <p className="text-xs text-flexoki-tx-3 text-center">
            {activeTab === "media"
              ? "Click any photo or video to insert it into your document"
              : "Click any voice note to insert it into your document"}
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
