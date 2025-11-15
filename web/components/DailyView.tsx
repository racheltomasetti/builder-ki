"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CycleInfo from "@/components/CycleInfo";
import ActivityBlock from "@/components/ActivityBlock";
import { ChevronUp } from "lucide-react";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  note_type: string;
  created_at: string;
  cycle_day?: number | null;
  cycle_phase?: string | null;
  timer_session_ids?: string[] | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: string;
  original_date: string;
  caption: string | null;
  created_at: string;
  timer_session_ids?: string[] | null;
};

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
};

type TimelineItem =
  | {
      type: "activity";
      session: TimerSession;
      linkedCaptures: Capture[];
      timestamp: string;
    }
  | { type: "capture"; capture: Capture; timestamp: string }
  | { type: "media"; media: MediaItem; timestamp: string };

type DayData = {
  date: string;
  intention?: Capture;
  timeline: TimelineItem[];
  reflection?: Capture;
  cycleDay: number | null;
  cyclePhase: string | null;
  hasContent: boolean;
};

interface DailyViewProps {
  searchQuery?: string;
  filters?: {
    noteType: string;
    cyclePhase: string;
    cycleDay: string;
  };
}

export default function DailyView({
  searchQuery = "",
  filters,
}: DailyViewProps) {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [daysToLoad, setDaysToLoad] = useState(30); // Start with 30 days

  const supabase = createClient();
  const topRef = useRef<HTMLDivElement>(null);

  // Handle scroll to show/hide "Jump to Today" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchDays();
  }, [daysToLoad, searchQuery, filters]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreDays = () => {
    setLoadingMore(true);
    setDaysToLoad((prev) => prev + 30);
  };

  const fetchDayData = async (dateString: string): Promise<DayData | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      // Fetch cycle info for this date
      const { data: cycleData } = await supabase.rpc("calculate_cycle_info", {
        p_user_id: user.id,
        p_date: dateString,
      });

      // Fetch captures for this day
      const { data: captures, error: capturesError } = await supabase
        .from("captures")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateString)
        .order("created_at", { ascending: true });

      if (capturesError) throw capturesError;

      // Fetch media for this day
      const { data: media, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .or(`original_date.eq.${dateString},log_date.eq.${dateString}`)
        .order("created_at", { ascending: true });

      if (mediaError) throw mediaError;

      // Fetch timer sessions for this day
      const { data: timerSessions, error: timersError } = await supabase
        .from("timer_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateString)
        .order("start_time", { ascending: true });

      if (timersError) throw timersError;

      // Organize captures by type
      const intention = captures?.find((c) => c.note_type === "intention");
      const reflection = captures?.find((c) => c.note_type === "reflection");
      const dailyCaptures =
        captures?.filter(
          (c) =>
            (c.note_type === "daily" || c.note_type === "general") &&
            c.id !== intention?.id &&
            c.id !== reflection?.id
        ) || [];

      // Build timeline with activities, captures, and media
      const timeline: TimelineItem[] = [];

      // Add activity blocks (timer sessions with linked captures)
      timerSessions?.forEach((session) => {
        const linkedCaptures = dailyCaptures.filter((capture) =>
          capture.timer_session_ids?.includes(session.id)
        );

        timeline.push({
          type: "activity",
          session,
          linkedCaptures,
          timestamp: session.start_time,
        });
      });

      // Add standalone captures (not linked to any timer)
      dailyCaptures.forEach((capture) => {
        const isLinkedToTimer =
          capture.timer_session_ids && capture.timer_session_ids.length > 0;
        if (!isLinkedToTimer) {
          timeline.push({
            type: "capture",
            capture,
            timestamp: capture.created_at,
          });
        }
      });

      // Add media items
      media?.forEach((mediaItem) => {
        timeline.push({
          type: "media",
          media: mediaItem,
          timestamp: mediaItem.created_at,
        });
      });

      // Sort timeline chronologically
      timeline.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const hasContent = !!(intention || timeline.length > 0 || reflection);

      return {
        date: dateString,
        intention,
        timeline,
        reflection,
        cycleDay: cycleData?.cycle_day || null,
        cyclePhase: cycleData?.cycle_phase || null,
        hasContent,
      };
    } catch (error) {
      console.error("Error fetching day data:", error);
      return null;
    }
  };

  const fetchDays = async () => {
    try {
      if (daysToLoad === 30) {
        setLoading(true);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Get current cycle start date (to show only current cycle)
      const { data: cycleData } = await supabase
        .from("cycle_logs")
        .select("start_date")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false })
        .limit(1);

      const currentCycleStart = cycleData?.[0]?.start_date || null;

      // Generate array of dates from today going back (only current cycle)
      const today = new Date();
      const dates: string[] = [];
      let reachedCycleStart = false;

      for (let i = 0; i < daysToLoad; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split("T")[0];

        // Stop when we reach before the current cycle start
        if (currentCycleStart && dateString < currentCycleStart) {
          reachedCycleStart = true;
          break;
        }

        dates.push(dateString);
      }

      // Fetch data for all dates
      const daysData = await Promise.all(
        dates.map((date) => fetchDayData(date))
      );

      // Filter out null results and apply filters
      let filteredDays = daysData.filter((day): day is DayData => day !== null);

      // Hide days with no content
      filteredDays = filteredDays.filter((day) => day.hasContent);

      // Apply search filter
      if (searchQuery.trim()) {
        filteredDays = filteredDays.filter((day) => {
          const intentionMatch = day.intention?.transcription
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
          const reflectionMatch = day.reflection?.transcription
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
          const timelineMatch = day.timeline.some((item) => {
            if (item.type === "capture") {
              return item.capture.transcription
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());
            }
            if (item.type === "activity") {
              return (
                item.session.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) ||
                item.linkedCaptures.some((c) =>
                  c.transcription
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
              );
            }
            if (item.type === "media") {
              return item.media.caption
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());
            }
            return false;
          });

          return intentionMatch || reflectionMatch || timelineMatch;
        });
      }

      // Apply cycle phase filter
      if (filters?.cyclePhase && filters.cyclePhase !== "all") {
        filteredDays = filteredDays.filter((day) => {
          if (filters.cyclePhase === "no_cycle_data") {
            return day.cyclePhase == null;
          }
          return day.cyclePhase === filters.cyclePhase;
        });
      }

      // Apply cycle day filter
      if (filters?.cycleDay && filters.cycleDay !== "all") {
        const targetDay = parseInt(filters.cycleDay);
        filteredDays = filteredDays.filter((day) => day.cycleDay === targetDay);
      }

      // Apply note type filter
      if (filters?.noteType && filters.noteType !== "all") {
        filteredDays = filteredDays.filter((day) => {
          if (filters.noteType === "intention") {
            return !!day.intention;
          }
          if (filters.noteType === "reflection") {
            return !!day.reflection;
          }
          if (filters.noteType === "daily" || filters.noteType === "general") {
            return day.timeline.some(
              (item) =>
                item.type === "capture" &&
                (item.capture.note_type === "daily" ||
                  item.capture.note_type === "general")
            );
          }
          return true;
        });
      }

      setDays(filteredDays);

      // Only show "Load more" if we haven't reached the cycle start yet
      setHasMore(!reachedCycleStart && dates.length === daysToLoad);
    } catch (error) {
      console.error("Error fetching days:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderDayCard = (dayData: DayData) => (
    <div
      key={dayData.date}
      className="bg-flexoki-ui-2 rounded-lg shadow-lg border border-flexoki-ui-3 p-8 mb-6"
    >
      {/* Date Header */}
      <div className="mb-6 pb-4 border-b border-flexoki-ui-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-flexoki-tx">
            {formatDate(dayData.date)}
          </h2>
          <CycleInfo
            cycleDay={dayData.cycleDay}
            cyclePhase={dayData.cyclePhase}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Intention - Always at top */}
        {dayData.intention && (
          <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl italic text-flexoki-accent font-bold">
                Daily Intention
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-flexoki-tx-3">
                {formatTime(dayData.intention.created_at)}
              </p>
              {dayData.intention.file_url && (
                <audio controls className="w-full h-10">
                  <source src={dayData.intention.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
              {dayData.intention.transcription && (
                <p className="text-flexoki-tx leading-relaxed mt-3">
                  {dayData.intention.transcription}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Timeline Section - Activities, Captures, Media */}
        {dayData.timeline.length > 0 && (
          <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
            <div className="space-y-6">
              {dayData.timeline.map((item) => {
                if (item.type === "activity") {
                  return (
                    <ActivityBlock
                      key={item.session.id}
                      session={item.session}
                      linkedCaptures={item.linkedCaptures}
                    />
                  );
                } else if (item.type === "capture") {
                  const capture = item.capture;
                  return (
                    <div
                      key={capture.id}
                      className="border-l-2 border-flexoki-accent pl-4 py-2"
                    >
                      <p className="text-sm text-flexoki-tx-3 mb-2">
                        ~ {formatTime(capture.created_at)} ~
                      </p>
                      {capture.file_url && (
                        <audio controls className="w-full mb-2 h-10">
                          <source src={capture.file_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {capture.transcription && (
                        <p className="text-flexoki-tx leading-relaxed">
                          {capture.transcription}
                        </p>
                      )}
                    </div>
                  );
                } else if (item.type === "media") {
                  const media = item.media;
                  return (
                    <div key={media.id} className="mb-4">
                      <p className="text-sm text-flexoki-tx-3 mb-2">
                        ~ {formatTime(media.created_at)} ~
                      </p>
                      {media.file_type === "video" ? (
                        <video
                          controls
                          className="w-full max-w-md rounded-lg shadow-md"
                        >
                          <source src={media.file_url} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      ) : (
                        <img
                          src={media.file_url}
                          alt={media.caption || "Photo"}
                          className="w-full max-w-md rounded-lg shadow-md"
                        />
                      )}
                      {media.caption && (
                        <p className="text-sm text-flexoki-tx-2 mt-2 italic">
                          {media.caption}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </section>
        )}

        {/* Reflection - Always at bottom */}
        {dayData.reflection && (
          <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl italic text-flexoki-accent font-bold">
                Daily Reflection
              </h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-flexoki-tx-3">
                {formatTime(dayData.reflection.created_at)}
              </p>
              {dayData.reflection.file_url && (
                <audio controls className="w-full h-10">
                  <source src={dayData.reflection.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
              {dayData.reflection.transcription && (
                <p className="text-flexoki-tx leading-relaxed mt-3">
                  {dayData.reflection.transcription}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">Loading...</p>
      </div>
    );
  }

  return (
    <div ref={topRef} className="w-full">
      {/* Day Cards Stream */}
      {days.length === 0 ? (
        <div className="bg-flexoki-ui rounded-lg shadow-md p-8">
          <div className="text-center">
            <p className="text-flexoki-tx-2 mb-4">
              {searchQuery || filters
                ? "No matching entries found."
                : "No entries yet."}
            </p>
            <p className="text-sm text-flexoki-tx-3">
              {searchQuery || filters
                ? "Try adjusting your search or filters."
                : "Use the mobile app to create daily logs and upload photos."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {days.map((day) => renderDayCard(day))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMoreDays}
                disabled={loadingMore}
                className="px-8 py-3 bg-flexoki-accent text-flexoki-bg font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load older days"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Jump to Today Floating Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-flexoki-accent text-flexoki-bg rounded-full shadow-lg hover:opacity-90 transition-all z-50"
          title="Jump to Today"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
