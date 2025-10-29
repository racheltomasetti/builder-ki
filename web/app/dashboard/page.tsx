"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VoiceCard from "@/components/VoiceCard";
import DailyView from "@/components/DailyView";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [allCaptures, setAllCaptures] = useState<Capture[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"feed" | "daily">("feed");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const supabase = createClient();

  // Debounce search query with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter captures based on debounced search
  const filteredCaptures = debouncedSearch.trim()
    ? allCaptures.filter((capture) => {
        const matchesTranscription = capture.transcription
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase());
        const matchesInsights = capture.insights?.some((insight) =>
          insight.content.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
        return matchesTranscription || matchesInsights;
      })
    : allCaptures;

  useEffect(() => {
    const loadCaptures = async () => {
      await fetchCaptures();
      setLoading(false);
    };

    loadCaptures();
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

  // Navigation functions for daily view
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
          {/* <h2 className="text-2xl font-bold text-flexoki-tx italic">
            captures
          </h2> */}
          <p className="text-flexoki-tx opacity-85 text-2xl mt-1 italic text-center font-bold">
            where the mind goes to wander
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("feed")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              viewMode === "feed"
                ? "bg-flexoki-accent text-flexoki-bg"
                : "bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 hover:bg-flexoki-ui-3"
            }`}
          >
            stream of thoughts
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              viewMode === "daily"
                ? "bg-flexoki-accent text-flexoki-bg"
                : "bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 hover:bg-flexoki-ui-3"
            }`}
          >
            daily log
          </button>
        </div>

        {/* Daily View Navigation - Only show in daily mode */}
        {viewMode === "daily" && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={goToPreviousDay}
              className="p-2 bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 rounded-lg hover:bg-flexoki-ui-3 transition-all"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-flexoki-tx px-4">
              {formatDateDisplay(selectedDate)}
            </span>
            <button
              onClick={goToNextDay}
              className="p-2 bg-flexoki-ui-2 text-flexoki-tx-2 border border-flexoki-ui-3 rounded-lg hover:bg-flexoki-ui-3 transition-all"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Conditional Content Based on View Mode */}
        {viewMode === "feed" ? (
          <>
            {/* Search Input - Only show in feed mode */}
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

            {/* Feed Content */}
            {filteredCaptures.length === 0 ? (
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
                        No captures yet. Start capturing your thoughts using the
                        mobile app.
                      </p>
                      <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-4 mt-6 text-left">
                        <h3 className="text-sm font-semibold text-flexoki-tx mb-2">
                          Next Steps:
                        </h3>
                        <ul className="text-sm text-flexoki-tx-2 space-y-1 list-disc list-inside">
                          <li>Open the KI mobile app and sign in</li>
                          <li>Tap the blue circle to record a voice note</li>
                          <li>Your captures will appear here once processed</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCaptures.map((capture) => (
                  <VoiceCard
                    key={capture.id}
                    capture={capture}
                    onDelete={fetchCaptures}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Daily View */
          <DailyView date={selectedDate} />
        )}
      </main>
    </>
  );
}
