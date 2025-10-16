"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import VoiceCard from "@/components/VoiceCard";
import TopNavigation from "@/components/TopNavigation";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCaptures, setAllCaptures] = useState<Capture[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();
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
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);
      await fetchCaptures();
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flexoki-bg">
        <p className="text-flexoki-tx-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flexoki-bg">
      <TopNavigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-flexoki-tx italic">
            THOUGHT CAPTURES
          </h2>
          <p className="text-flexoki-tx-2 mt-1 italic">
            where the mind is free to wander
          </p>
        </div>

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
      </main>
    </div>
  );
}
