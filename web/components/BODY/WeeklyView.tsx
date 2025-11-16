"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import VoiceNoteModal from "./VoiceNoteModal";
import WeeklyKey from "./WeeklyKey";

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  log_date: string;
};

type Capture = {
  id: string;
  type: string;
  note_type: string;
  transcription: string | null;
  file_url: string | null;
  created_at: string;
  timer_session_ids: string[] | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  log_date: string | null;
};

type CycleInfo = {
  cycle_day: number | null;
  cycle_phase: string | null;
};

type DayData = {
  date: string;
  dayName: string;
  dayNumber: number;
  cycleInfo: CycleInfo | null;
  timerSessions: TimerSession[];
  captures: Capture[];
  mediaItems: MediaItem[];
};

export default function WeeklyView() {
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    getWeekStart(new Date())
  );
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(true);
  const [selectedCapture, setSelectedCapture] = useState<{
    capture: Capture;
    cycleInfo: CycleInfo | null;
    activityName?: string;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchWeekData();
  }, [weekStartDate]);

  // Get Sunday of the current week
  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = d.getDate() - day; // Subtract days to get to Sunday
    return new Date(d.setDate(diff));
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setWeekStartDate(newDate);
  };

  const fetchWeekData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Generate array of 7 dates for the week
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + i);
        // Format date in local timezone, not UTC
        const dateString = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dates.push(dateString);
      }

      // Fetch all data for the week
      const weekDataPromises = dates.map(async (date) => {
        // Force local timezone interpretation by appending time
        const localDate = new Date(date + "T00:00:00");
        const dayOfWeek = localDate.getDay();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Fetch cycle info
        const { data: cycleData } = await supabase.rpc("calculate_cycle_info", {
          p_user_id: user.id,
          p_date: date,
        });

        // Fetch timer sessions
        const { data: sessions } = await supabase
          .from("timer_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", date)
          .order("start_time", { ascending: true });

        // Fetch captures
        const { data: captures } = await supabase
          .from("captures")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", date)
          .order("created_at", { ascending: true });

        // Fetch media
        const { data: media } = await supabase
          .from("media_items")
          .select("*")
          .eq("user_id", user.id)
          .or(`log_date.eq.${date},original_date.eq.${date}`)
          .order("created_at", { ascending: true });

        return {
          date,
          dayName: dayNames[dayOfWeek],
          dayNumber: localDate.getDate(),
          cycleInfo: cycleData || null,
          timerSessions: sessions || [],
          captures: captures || [],
          mediaItems: media || [],
        };
      });

      const data = await Promise.all(weekDataPromises);
      setWeekData(data);
    } catch (error) {
      console.error("Error fetching week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCyclePhaseBorderColor = (phase: string | null) => {
    switch (phase) {
      case "menstrual":
        return "border-blue-600 border-opacity-50 bg-blue-500 bg-opacity-30";
      case "follicular":
        return "border-green-600 border-opacity-50 bg-green-500 bg-opacity-30";
      case "ovulation":
        return "border-yellow-600 border-opacity-50 bg-yellow-500 bg-opacity-30";
      case "luteal":
        return "border-orange-600 border-opacity-50 bg-orange-500 bg-opacity-30";
      default:
        return "border-flexoki-ui-3";
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return dateString === todayString;
  };

  const formatWeekRange = () => {
    const start = new Date(weekStartDate);
    const end = new Date(weekStartDate);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  // Generate 24-hour time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return { hour, label: `${displayHour} ${ampm}` };
  });

  // Calculate position and height for activity blocks
  const getBlockStyle = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const startHour = start.getHours() + start.getMinutes() / 60;

    let durationHours = 1; // Default 1 hour if no end time
    if (endTime) {
      const end = new Date(endTime);
      const endHour = end.getHours() + end.getMinutes() / 60;
      durationHours = endHour - startHour;
    }

    const hourHeight = 40; // 40px per hour (condensed)
    const top = startHour * hourHeight;
    const height = durationHours * hourHeight;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 24)}px`, // Minimum 24px height
    };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return "";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">Loading week...</p>
      </div>
    );
  }

  return (
    <div className="bg-flexoki-ui-2 rounded-xl shadow-lg border border-flexoki-ui-3 overflow-hidden">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Previous Week"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <h2 className="text-lg font-semibold text-flexoki-tx">
          {formatWeekRange()}
        </h2>
        <button
          onClick={() => navigateWeek("next")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Next Week"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>
      {/* Weekly Key above weekly calendar */}
      <div className="px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <WeeklyKey
          showPhaseOverlay={showPhaseOverlay}
          onTogglePhaseOverlay={setShowPhaseOverlay}
        />
      </div>

      {/* Weekly Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-flexoki-ui-3">
            <div className="p-2 text-center text-md font-semibold text-flexoki-tx-2 bg-flexoki-ui-2">
              TIME
            </div>
            {weekData.map((day) => (
              <div
                key={day.date}
                className="p-1 text-center border-l border-flexoki-ui-3 bg-flexoki-ui"
              >
                <div
                  className={`h-full rounded-lg px-2 py-2 flex flex-col justify-center items-center relative ${
                    isToday(day.date) ? "" : "bg-flexoki-ui"
                  }`}
                  style={
                    isToday(day.date)
                      ? {
                          border: "3px solid rgba(58, 169, 159, 0.5)",
                        }
                      : undefined
                  }
                >
                  {day.cycleInfo?.cycle_day && (
                    <span
                      className={`absolute top-1 right-1 text-[11px] rounded px-1 border-2 ${
                        showPhaseOverlay
                          ? `${getCyclePhaseBorderColor(
                              day.cycleInfo?.cycle_phase || null
                            )} text-flexoki-tx`
                          : "border-flexoki-ui bg-flexoki-ui text-flexoki-tx-2"
                      }`}
                    >
                      Day {day.cycleInfo.cycle_day}
                    </span>
                  )}
                  <div className="text-xl font-semibold text-flexoki-tx">
                    {day.dayName}
                  </div>
                  <div className="text-xl font-bold text-flexoki-tx">
                    {day.dayNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-8">
            {/* Time Column */}
            <div className="border-r border-flexoki-ui-3">
              {timeSlots.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-[40px] border-b border-flexoki-ui-3 px-2 py-0.5 text-[10px] text-flexoki-tx-3 text-right"
                >
                  {slot.label}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekData.map((day) => (
              <div
                key={day.date}
                className="border-l border-flexoki-ui-3 relative bg-flexoki-ui"
              >
                {/* Hour grid lines */}
                {timeSlots.map((slot) => (
                  <div
                    key={slot.hour}
                    className="h-[40px] border-b border-flexoki-ui-3"
                  />
                ))}

                {/* Activity Blocks positioned absolutely */}
                <div className="absolute inset-0 pointer-events-none">
                  {day.timerSessions.map((session) => {
                    const style = getBlockStyle(
                      session.start_time,
                      session.end_time
                    );
                    const linkedCaptures = day.captures.filter((c) =>
                      c.timer_session_ids?.includes(session.id)
                    );

                    return (
                      <div
                        key={session.id}
                        className={`absolute left-1 right-1 rounded-md p-1.5 pointer-events-auto border-2 ${
                          showPhaseOverlay
                            ? getCyclePhaseBorderColor(
                                day.cycleInfo?.cycle_phase || null
                              )
                            : "border-flexoki-ui-3"
                        } bg-flexoki-accent-2 shadow-sm overflow-hidden`}
                        style={style}
                      >
                        <div className="text-[10px] font-semibold text-flexoki-tx truncate">
                          {session.name}
                        </div>
                        <div className="text-[9px] text-flexoki-tx">
                          {formatTime(session.start_time)}
                        </div>
                        {session.end_time && (
                          <div className="text-[9px] text-flexoki-tx">
                            {calculateDuration(
                              session.start_time,
                              session.end_time
                            )}
                          </div>
                        )}

                        {/* Voice captures within this activity */}
                        {linkedCaptures.map((capture) => (
                          <div
                            key={capture.id}
                            className="mt-0.5 text-xs text-flexoki-tx-2 flex items-center gap-1 opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
                            onClick={() =>
                              setSelectedCapture({
                                capture,
                                cycleInfo: day.cycleInfo,
                                activityName: session.name,
                              })
                            }
                          >
                            <div className="w-full h-px bg-flexoki-accent"></div>
                            <span className="text-[8px]">🎤</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Standalone captures (intentions, reflections, general) */}
                  {day.captures
                    .filter(
                      (c) =>
                        !c.timer_session_ids || c.timer_session_ids.length === 0
                    )
                    .map((capture) => {
                      const captureTime = new Date(capture.created_at);
                      const hour =
                        captureTime.getHours() + captureTime.getMinutes() / 60;
                      const top = hour * 40; // Use condensed hour height

                      // Color based on note type
                      let bgColor = "bg-red-600";
                      let borderColor = "border-red-400";
                      if (capture.note_type === "intention") {
                        bgColor = "bg-yellow-600";
                        borderColor = "border-yellow-500";
                      } else if (capture.note_type === "reflection") {
                        bgColor = "bg-purple-600";
                        borderColor = "border-purple-400";
                      }

                      return (
                        <div
                          key={capture.id}
                          className={`absolute left-1 right-1 rounded-md p-1.5 pointer-events-auto ${bgColor} border ${borderColor} bg-opacity-50 cursor-pointer hover:opacity-100 transition-opacity`}
                          style={{
                            top: `${top}px`,
                            height: "24px",
                          }}
                          onClick={() =>
                            setSelectedCapture({
                              capture,
                              cycleInfo: day.cycleInfo,
                            })
                          }
                        >
                          <div className="text-[9px] text-flexoki-tx text-right">
                            {formatTime(capture.created_at)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          {/* Media Grid at Bottom */}
          <div className="grid grid-cols-8 border-t-2 border-flexoki-ui-3 bg-flexoki-ui">
            <div className="p-1.5 text-[14px] bg-flexoki-ui-2 font-semibold text-flexoki-tx-2">
              {"MEDIA"}
            </div>
            {weekData.map((day) => (
              <div
                key={`media-${day.date}`}
                className="border-l border-flexoki-ui-3 p-1.5"
              >
                {day.mediaItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {day.mediaItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="w-8 h-8 rounded overflow-hidden bg-flexoki-ui-3"
                      >
                        {item.file_type === "image" ? (
                          <img
                            src={item.file_url}
                            alt="Media"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {day.mediaItems.length > 3 && (
                      <div className="w-8 h-8 rounded bg-flexoki-ui-3 flex items-center justify-center text-[9px] text-flexoki-tx-3">
                        +{day.mediaItems.length - 3}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-flexoki-tx-3 italic">-</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bottom Week Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-t border-flexoki-ui-3">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Previous Week"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <h2 className="text-lg font-semibold text-flexoki-tx">
          {formatWeekRange()}
        </h2>
        <button
          onClick={() => navigateWeek("next")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Next Week"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>
      {/* Voice Note Modal */}
      <VoiceNoteModal
        capture={selectedCapture?.capture || null}
        cycleInfo={selectedCapture?.cycleInfo}
        linkedActivityName={selectedCapture?.activityName}
        onClose={() => setSelectedCapture(null)}
      />
    </div>
  );
}
