"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  note_type: string;
  created_at: string;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: string;
  original_date: string;
  caption: string | null;
  created_at: string;
};

type DayData = {
  date: string;
  intention?: Capture;
  dailyCaptures: Capture[];
  reflection?: Capture;
  media: MediaItem[];
};

interface DailyViewProps {
  date: string;
  onDateChange?: (date: string) => void;
}

export default function DailyView({ date, onDateChange }: DailyViewProps) {
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (date) {
      fetchDayData(date);
    }
  }, [date]);

  const fetchDayData = async (dateString: string) => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

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

      // Organize captures by type
      const intention = captures?.find((c) => c.note_type === "intention");
      const reflection = captures?.find((c) => c.note_type === "reflection");
      const dailyCaptures =
        captures?.filter(
          (c) => c.note_type === "daily" || c.note_type === "general"
        ) || [];

      setDayData({
        date: dateString,
        intention,
        dailyCaptures,
        reflection,
        media: media || [],
      });
    } catch (error) {
      console.error("Error fetching day data:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">Loading...</p>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">No data found for this date.</p>
      </div>
    );
  }

  const hasAnyData =
    dayData.intention ||
    dayData.dailyCaptures.length > 0 ||
    dayData.reflection ||
    dayData.media.length > 0;

  return (
    <div className="w-full">
      {/* Date Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-flexoki-tx">
          {formatDate(date)}
        </h1>
      </div>

      {!hasAnyData ? (
        <div className="bg-flexoki-ui rounded-lg shadow-md p-8">
          <div className="text-center">
            <p className="text-flexoki-tx-2 mb-4">
              No entries for this day yet.
            </p>
            <p className="text-sm text-flexoki-tx-3">
              Use the mobile app to create daily logs and upload photos for this
              date.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intention */}
          {dayData.intention && (
            <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">☀️</span>
                <h2 className="text-xl font-semibold text-flexoki-tx">
                  Morning Intention
                </h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-flexoki-tx-3">
                  {formatTime(dayData.intention.created_at)}
                </p>
                {dayData.intention.file_url && (
                  <audio controls className="w-full">
                    <source
                      src={dayData.intention.file_url}
                      type="audio/mpeg"
                    />
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

          {/* Daily Captures */}
          {dayData.dailyCaptures.length > 0 && (
            <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📝</span>
                <h2 className="text-xl font-semibold text-flexoki-tx">
                  Daily Captures ({dayData.dailyCaptures.length})
                </h2>
              </div>
              <div className="space-y-4">
                {dayData.dailyCaptures.map((capture) => (
                  <div
                    key={capture.id}
                    className="border-l-2 border-flexoki-accent pl-4 py-2"
                  >
                    <p className="text-sm text-flexoki-tx-3 mb-2">
                      {formatTime(capture.created_at)}
                    </p>
                    {capture.file_url && (
                      <audio controls className="w-full mb-2">
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
                ))}
              </div>
            </section>
          )}

          {/* Media */}
          {dayData.media.length > 0 && (
            <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📸</span>
                <h2 className="text-xl font-semibold text-flexoki-tx">
                  Photos ({dayData.media.length})
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {dayData.media.map((item) => (
                  <div key={item.id} className="relative aspect-square">
                    <img
                      src={item.file_url}
                      alt={item.caption || "Photo"}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reflection */}
          {dayData.reflection && (
            <section className="bg-flexoki-ui rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌙</span>
                <h2 className="text-xl font-semibold text-flexoki-tx">
                  Evening Reflection
                </h2>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-flexoki-tx-3">
                  {formatTime(dayData.reflection.created_at)}
                </p>
                {dayData.reflection.file_url && (
                  <audio controls className="w-full">
                    <source
                      src={dayData.reflection.file_url}
                      type="audio/mpeg"
                    />
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
      )}
    </div>
  );
}
