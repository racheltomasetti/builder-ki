"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VoiceCard from "@/components/VoiceCard";
import DailyView from "@/components/DailyView";
import FilterToolbar from "@/components/FilterToolbar";
import MediaGrid from "@/components/MediaGrid";
import MediaModal from "@/components/MediaModal";
import { countMatches } from "@/lib/highlightText";
import { Search, Calendar, LayoutGrid, Grid3x3, Grid2x2 } from "lucide-react";

type Insight = {
  id: string;
  type: "insight" | "decision" | "question" | "concept";
  content: string;
  created_at: string;
};

type Capture = {
  id: string;
  type: string;
  file_url: string;
  transcription: string | null;
  processing_status: string;
  created_at: string;
  processed_at: string | null;
  insights: Insight[];
  cycle_day?: number | null;
  cycle_phase?: string | null;
  note_type?: string | null;
  log_date?: string | null;
  is_favorited?: boolean;
};

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
  cycle_day?: number | null;
  cycle_phase?: string | null;
};

type FilterState = {
  noteType: string; // 'all', 'general', 'intention', 'daily', 'reflection'
  cyclePhase: string; // 'all', 'menstrual', 'follicular', 'ovulation', 'luteal', 'no_cycle_data'
  cycleDay: string; // 'all', '1', '2', ... '28'
  dateRange: string; // 'all_time', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'custom'
  isFavorited: string; // 'all', 'favorited', 'not_favorited'
  customDateStart?: string;
  customDateEnd?: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allCaptures, setAllCaptures] = useState<Capture[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "daily">("feed");
  const [feedSubView, setFeedSubView] = useState<"voice" | "media">("voice");
  const [filters, setFilters] = useState<FilterState>({
    noteType: "all",
    cyclePhase: "all",
    cycleDay: "all",
    dateRange: "all_time",
    isFavorited: "all",
  });
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaFilterDate, setMediaFilterDate] = useState("");
  const supabase = createClient();

  // Debounce search query with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter captures based on search and filters (for feed view)
  const filteredCaptures = allCaptures.filter((capture) => {
    // Search filter
    if (debouncedSearch.trim()) {
      const matchesTranscription = capture.transcription
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesInsights = capture.insights?.some((insight) =>
        insight.content.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      if (!matchesTranscription && !matchesInsights) {
        return false;
      }
    }

    // Note Type filter
    if (filters.noteType !== "all") {
      const captureNoteType = capture.note_type || "general";
      if (captureNoteType !== filters.noteType) {
        return false;
      }
    }

    // Cycle Phase filter
    if (filters.cyclePhase !== "all") {
      if (filters.cyclePhase === "no_cycle_data") {
        if (capture.cycle_phase != null) {
          return false;
        }
      } else {
        if (capture.cycle_phase !== filters.cyclePhase) {
          return false;
        }
      }
    }

    // Cycle Day filter
    if (filters.cycleDay !== "all") {
      const targetDay = parseInt(filters.cycleDay);
      if (capture.cycle_day !== targetDay) {
        return false;
      }
    }

    // Date Range filter
    if (filters.dateRange !== "all_time") {
      const captureDate = new Date(capture.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === "last_7_days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (captureDate < sevenDaysAgo) {
          return false;
        }
      } else if (filters.dateRange === "last_30_days") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (captureDate < thirtyDaysAgo) {
          return false;
        }
      } else if (filters.dateRange === "this_month") {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        if (captureDate < firstDayOfMonth) {
          return false;
        }
      } else if (filters.dateRange === "last_month") {
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const firstDayOfThisMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        if (
          captureDate < firstDayOfLastMonth ||
          captureDate >= firstDayOfThisMonth
        ) {
          return false;
        }
      } else if (filters.dateRange === "custom") {
        if (filters.customDateStart) {
          const startDate = new Date(filters.customDateStart);
          startDate.setHours(0, 0, 0, 0);
          if (captureDate < startDate) {
            return false;
          }
        }
        if (filters.customDateEnd) {
          const endDate = new Date(filters.customDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (captureDate > endDate) {
            return false;
          }
        }
      }
    }

    // Favorited filter
    if (filters.isFavorited !== "all") {
      const isFavorited = capture.is_favorited || false;
      if (filters.isFavorited === "favorited" && !isFavorited) {
        return false;
      }
      if (filters.isFavorited === "not_favorited" && isFavorited) {
        return false;
      }
    }

    return true;
  });

  // Filter media items based on filters (media view has its own search)
  const filteredMedia = allMedia.filter((media) => {
    // Search filter - search in caption and tags (use media-specific search)
    if (mediaSearchQuery.trim()) {
      const matchesCaption = media.caption
        ?.toLowerCase()
        .includes(mediaSearchQuery.toLowerCase());
      const matchesTags = media.tags?.some((tag) =>
        tag.toLowerCase().includes(mediaSearchQuery.toLowerCase())
      );
      if (!matchesCaption && !matchesTags) {
        return false;
      }
    }

    // Date filter (media-specific)
    if (mediaFilterDate) {
      const mediaDate = media.original_date || media.created_at.split("T")[0];
      if (mediaDate !== mediaFilterDate) {
        return false;
      }
    }

    // Cycle Phase filter
    if (filters.cyclePhase !== "all") {
      if (filters.cyclePhase === "no_cycle_data") {
        if (media.cycle_phase != null) {
          return false;
        }
      } else {
        if (media.cycle_phase !== filters.cyclePhase) {
          return false;
        }
      }
    }

    // Cycle Day filter
    if (filters.cycleDay !== "all") {
      const targetDay = parseInt(filters.cycleDay);
      if (media.cycle_day !== targetDay) {
        return false;
      }
    }

    // Date Range filter
    if (filters.dateRange !== "all_time") {
      const mediaDate = new Date(media.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === "last_7_days") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (mediaDate < sevenDaysAgo) {
          return false;
        }
      } else if (filters.dateRange === "last_30_days") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (mediaDate < thirtyDaysAgo) {
          return false;
        }
      } else if (filters.dateRange === "this_month") {
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        if (mediaDate < firstDayOfMonth) {
          return false;
        }
      } else if (filters.dateRange === "last_month") {
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const firstDayOfThisMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        if (
          mediaDate < firstDayOfLastMonth ||
          mediaDate >= firstDayOfThisMonth
        ) {
          return false;
        }
      } else if (filters.dateRange === "custom") {
        if (filters.customDateStart) {
          const startDate = new Date(filters.customDateStart);
          startDate.setHours(0, 0, 0, 0);
          if (mediaDate < startDate) {
            return false;
          }
        }
        if (filters.customDateEnd) {
          const endDate = new Date(filters.customDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (mediaDate > endDate) {
            return false;
          }
        }
      }
    }

    return true;
  });

  // Voice-only feed (media separated into grid view)
  const voiceFeed = filteredCaptures;

  // Calculate total number of word matches across all captures
  const totalMatches = debouncedSearch.trim()
    ? filteredCaptures.reduce((total, capture) => {
        let captureTotal = 0;

        // Count matches in transcription
        if (capture.transcription) {
          captureTotal += countMatches(capture.transcription, debouncedSearch);
        }

        // Count matches in insights
        if (capture.insights) {
          capture.insights.forEach((insight) => {
            captureTotal += countMatches(insight.content, debouncedSearch);
          });
        }

        return total + captureTotal;
      }, 0)
    : 0;

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCaptures(), fetchMedia()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const fetchCaptures = async () => {
    const { data, error } = await supabase
      .from("captures")
      .select(
        `
        *,
        insights (*)
      `
      )
      .eq("type", "voice")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching captures:", error);
      return;
    }

    setAllCaptures(data || []);
  };

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from("media_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching media:", error);
      return;
    }

    setAllMedia(data || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-flexoki-tx-2">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-flexoki-tx opacity-85 text-2xl mt-1 italic text-center font-bold">
            ~ where the mind goes to wander ~
          </p>
          <hr className="mt-4 border-flexoki-ui-3" />
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("feed")}
            className={`px-6 py-2 rounded-lg transition-all text-flexoki-tx ${
              viewMode === "feed"
                ? "bg-flexoki-accent font-bold"
                : "bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 font-medium hover:text-xl hover:font-bold hover:text-flexoki-accent"
            }`}
          >
            stream of consciousness
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`px-6 py-2 rounded-lg transition-all text-flexoki-tx ${
              viewMode === "daily"
                ? "bg-flexoki-accent font-bold"
                : "bg-flexoki-ui-2 text-flexoki-tx border border-flexoki-ui-3 font-medium hover:text-xl hover:font-bold hover:text-flexoki-accent"
            }`}
          >
            daily log
          </button>
        </div>

        {/* Sub-toggle for Stream of Consciousness: Voice vs Media */}
        {viewMode === "feed" && (
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setFeedSubView("voice")}
              className={`px-6 py-2 rounded-lg transition-all text-flexoki-tx ${
                feedSubView === "voice"
                  ? "bg-flexoki-accent-2 font-bold"
                  : "bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 font-medium hover:bg-flexoki-ui-3 hover:text-flexoki-accent-2 hover:font-bold hover:text-xl"
              }`}
            >
              voice
            </button>
            <button
              onClick={() => setFeedSubView("media")}
              className={`px-6 py-2 rounded-lg transition-all text-flexoki-tx ${
                feedSubView === "media"
                  ? "bg-flexoki-accent-2 font-bold"
                  : "bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 font-medium hover:bg-flexoki-ui-3 hover:text-flexoki-accent-2 hover:font-bold hover:text-xl"
              }`}
            >
              media
            </button>
          </div>
        )}

        {/* Voice View: Search Input & Filters */}
        {viewMode === "feed" && feedSubView === "voice" && (
          <>
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-flexoki-tx-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transcriptions and insights..."
                  className="block w-full pl-10 pr-10 py-3 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-flexoki-tx-3 hover:text-flexoki-tx transition-colors"
                    title="Clear search"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Toolbar */}
            <FilterToolbar filters={filters} onFiltersChange={setFilters} />
          </>
        )}

        {/* Media View: Search & Grid Controls */}
        {viewMode === "feed" && feedSubView === "media" && (
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-flexoki-tx-3" />
              </div>
              <input
                type="text"
                value={mediaSearchQuery}
                onChange={(e) => setMediaSearchQuery(e.target.value)}
                placeholder="Search captions and tags..."
                className="block w-full pl-10 pr-4 py-3 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-flexoki-tx-3" />
              </div>
              <input
                type="date"
                value={mediaFilterDate}
                onChange={(e) => setMediaFilterDate(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
              />
            </div>

            {/* Grid Size Controls */}
            <div className="flex items-center gap-1 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg p-1">
              <button
                onClick={() => setGridSize("small")}
                className={`p-2 rounded transition-colors ${
                  gridSize === "small"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
                title="Small thumbnails"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridSize("medium")}
                className={`p-2 rounded transition-colors ${
                  gridSize === "medium"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
                title="Medium thumbnails"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setGridSize("large")}
                className={`p-2 rounded transition-colors ${
                  gridSize === "large"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
                title="Large thumbnails"
              >
                <Grid2x2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Conditional Content Based on View Mode */}
        {viewMode === "feed" ? (
          <>
            {/* Voice Feed View */}
            {feedSubView === "voice" && (
              <>
                {/* Search Results Count */}
                {debouncedSearch.trim() && (
                  <div className="mb-6 text-center">
                    <p className="text-flexoki-tx-2 text-lg">
                      Found{" "}
                      <span className="font-bold text-flexoki-accent">
                        {totalMatches}
                      </span>{" "}
                      {totalMatches === 1 ? "match" : "matches"} across{" "}
                      <span className="font-bold text-flexoki-accent">
                        {voiceFeed.length}
                      </span>{" "}
                      {voiceFeed.length === 1 ? "capture" : "captures"}
                    </p>
                  </div>
                )}

                {/* Voice Feed Content */}
                {voiceFeed.length === 0 ? (
                  <div className="bg-flexoki-ui rounded-lg shadow-md p-6">
                    <div className="text-center py-12">
                      {debouncedSearch.trim() ? (
                        <>
                          <p className="text-flexoki-tx-2 mb-2">
                            No matches found for "{debouncedSearch}"
                          </p>
                          <p className="text-sm text-flexoki-tx-3 mb-4">
                            Try searching with different keywords or{" "}
                            <button
                              onClick={() => setSearchQuery("")}
                              className="text-flexoki-accent hover:underline"
                            >
                              clear your search
                            </button>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-flexoki-tx-2 mb-4">
                            No voice captures yet. Start capturing your thoughts
                            using the mobile app.
                          </p>
                          <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-4 mt-6 text-left">
                            <h3 className="text-sm font-semibold text-flexoki-tx mb-2">
                              Next Steps:
                            </h3>
                            <ul className="text-sm text-flexoki-tx-2 space-y-1 list-disc list-inside">
                              <li>Open the KI mobile app and sign in</li>
                              <li>
                                Tap the blue circle to record a voice note
                              </li>
                              <li>
                                Your captures will appear here once processed
                              </li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {voiceFeed.map((capture) => (
                      <VoiceCard
                        key={capture.id}
                        capture={capture}
                        onDelete={fetchCaptures}
                        searchQuery={debouncedSearch}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Media Grid View */}
            {feedSubView === "media" && (
              <>
                {filteredMedia.length === 0 ? (
                  <div className="bg-flexoki-ui rounded-lg shadow-md p-6">
                    <div className="text-center py-12">
                      <p className="text-flexoki-tx-2 mb-2">
                        {mediaSearchQuery || mediaFilterDate
                          ? "No media found matching your filters"
                          : "No media uploaded yet"}
                      </p>
                      <p className="text-sm text-flexoki-tx-3">
                        Use the mobile app to upload photos and videos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <MediaGrid
                    mediaItems={filteredMedia}
                    onDelete={async (id: string) => {
                      // Handle delete confirmation
                      if (
                        !confirm(
                          "Are you sure you want to delete this media item?"
                        )
                      ) {
                        return;
                      }
                      const item = allMedia.find((m) => m.id === id);
                      if (item) {
                        const url = new URL(item.file_url);
                        const filePath = url.pathname
                          .split("/")
                          .slice(3)
                          .join("/");
                        await supabase.storage
                          .from("media-items")
                          .remove([filePath]);
                      }
                      await supabase.from("media_items").delete().eq("id", id);
                      await fetchMedia();
                    }}
                    onMediaClick={setSelectedMedia}
                    size={gridSize}
                  />
                )}
              </>
            )}
          </>
        ) : (
          /* Daily Log View - Always shows unfiltered chronological flow */
          <DailyView />
        )}

        {/* Media Modal */}
        {selectedMedia && (
          <MediaModal
            mediaItem={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            allMedia={filteredMedia}
            onNavigate={setSelectedMedia}
            onUpdate={fetchMedia}
          />
        )}
      </main>
    </>
  );
}
