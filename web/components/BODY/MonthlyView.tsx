"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DailyViewModal from "./DailyViewModal";
import MonthlyKey from "./MonthlyKey";

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
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
  file_type: string;
  original_date: string;
  caption: string | null;
  created_at: string;
  timer_session_ids?: string[] | null;
};

type CycleInfo = {
  cycle_day: number | null;
  cycle_phase: string | null;
};

type DayData = {
  date: string;
  dateObj: Date;
  cycleInfo: CycleInfo | null;
  timerSessions: TimerSession[];
  captures: Capture[];
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

type ModalDayData = {
  date: string;
  intention?: Capture;
  timeline: TimelineItem[];
  reflection?: Capture;
  cycleDay: number | null;
  cyclePhase: string | null;
};

export default function MonthlyView() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayData, setSelectedDayData] = useState<ModalDayData | null>(
    null
  );
  const [loadingDayDetails, setLoadingDayDetails] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchMonthData();
  }, [currentMonth]);

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Generate 42 days for the calendar grid
      const calendarDays = generateCalendarDays();

      // Generate date strings for all 42 days
      const dates: string[] = calendarDays.map((d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      });

      // Fetch all data for the month (42 days)
      const monthDataPromises = dates.map(async (date, index) => {
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

        // Fetch captures (voice notes only for counts)
        const { data: captures } = await supabase
          .from("captures")
          .select("*")
          .eq("user_id", user.id)
          .eq("log_date", date)
          .order("created_at", { ascending: true });

        return {
          date,
          dateObj: calendarDays[index],
          cycleInfo: cycleData || null,
          timerSessions: sessions || [],
          captures: captures || [],
        };
      });

      const data = await Promise.all(monthDataPromises);
      setMonthData(data);
    } catch (error) {
      console.error("Error fetching month data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate 42 days (6 weeks) for the calendar grid
  const generateCalendarDays = () => {
    const days: Date[] = [];

    // Get first day of the month
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Calculate start date (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    // Generate 42 days
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return days;
  };
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getCyclePhaseBorderColor = (phase: string | null) => {
    switch (phase) {
      case "menstrual":
        return "border-blue-600 border-opacity-50";
      case "follicular":
        return "border-green-600 border-opacity-50";
      case "ovulation":
        return "border-yellow-600 border-opacity-50";
      case "luteal":
        return "border-orange-600 border-opacity-50";
      default:
        return "border-flexoki-ui-3";
    }
  };

  const fetchDayDetails = async (dateString: string) => {
    try {
      setLoadingDayDetails(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch cycle info
      const { data: cycleData } = await supabase.rpc("calculate_cycle_info", {
        p_user_id: user.id,
        p_date: dateString,
      });

      // Fetch all captures for this day
      const { data: captures } = await supabase
        .from("captures")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateString)
        .order("created_at", { ascending: true });

      // Fetch media items for this day
      const { data: media } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .or(`original_date.eq.${dateString},log_date.eq.${dateString}`)
        .order("created_at", { ascending: true });

      // Fetch timer sessions for this day
      const { data: timerSessions } = await supabase
        .from("timer_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateString)
        .order("start_time", { ascending: true });

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

      // Build timeline with flows, captures, and media
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

      setSelectedDayData({
        date: dateString,
        intention,
        timeline,
        reflection,
        cycleDay: cycleData?.cycle_day || null,
        cyclePhase: cycleData?.cycle_phase || null,
      });
    } catch (error) {
      console.error("Error fetching day details:", error);
    } finally {
      setLoadingDayDetails(false);
    }
  };

  const handleDayClick = (dateString: string) => {
    fetchDayDetails(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">Loading month...</p>
      </div>
    );
  }

  return (
    <div className="bg-flexoki-ui rounded-xl shadow-lg border border-flexoki-ui-3 overflow-hidden">
      {/* Monthly Key above monthly calendar */}
      <div className="px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <MonthlyKey />
      </div>

      {/* Month Navigation - Top */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <h2 className="text-lg font-semibold text-flexoki-tx">
          {formatMonthYear()}
        </h2>
        <button
          onClick={() => navigateMonth("next")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-flexoki-tx-3 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthData.map((dayData, index) => {
            const { dateObj, cycleInfo, timerSessions, captures } = dayData;
            const voiceCaptures = captures.filter((c) => c.type === "voice");
            const intentions = captures.filter(
              (c) => c.note_type === "intention"
            );
            const reflections = captures.filter(
              (c) => c.note_type === "reflection"
            );

            return (
              <div
                key={index}
                onClick={() => handleDayClick(dayData.date)}
                className={`
                  min-h-[100px] p-2 rounded-lg border-2
                  ${
                    isCurrentMonth(dateObj)
                      ? `bg-flexoki-ui-2 ${getCyclePhaseBorderColor(
                          cycleInfo?.cycle_phase || null
                        )}`
                      : "bg-flexoki-ui opacity-50 border-flexoki-ui-3"
                  }
                  hover:opacity-100 transition-all cursor-pointer
                `}
              >
                {/* Date Number */}
                <div className="flex items-start justify-between">
                  <span
                    className={`font-bold ${
                      isToday(dateObj)
                        ? "text-2xl text-flexoki-accent"
                        : isCurrentMonth(dateObj)
                        ? "text-lg text-flexoki-tx"
                        : "text-lg text-flexoki-tx-3"
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>
                  {/* Cycle Day */}
                  {cycleInfo?.cycle_day && isCurrentMonth(dateObj) && (
                    <span className="text-[10px] text-flexoki-tx-3 bg-flexoki-ui rounded px-1">
                      Day {cycleInfo.cycle_day}
                    </span>
                  )}
                </div>

                {/* Activity and Voice Note Counts */}
                <div className="mt-2 space-y-1">
                  {/* Intention Count */}
                  {intentions.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-flexoki-tx-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      <span>
                        {intentions.length === 1 ? "intention" : "intentions"}
                      </span>
                    </div>
                  )}
                  {/* Reflection Count */}
                  {reflections.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-flexoki-tx-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span>
                        {reflections.length === 1
                          ? "reflection"
                          : "reflections"}
                      </span>
                    </div>
                  )}
                  {/* Timer Sessions Count */}
                  {timerSessions.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-flexoki-tx-2">
                      <div className="w-2 h-2 rounded-full bg-flexoki-accent-2"></div>
                      <span>
                        {timerSessions.length}{" "}
                        {timerSessions.length === 1 ? "flow" : "flows"}
                      </span>
                    </div>
                  )}
                  {/* Voice Captures Count */}
                  {voiceCaptures.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-flexoki-tx-2">
                      <div className="w-2 h-2 rounded-full bg-flexoki-accent "></div>
                      <span>
                        {voiceCaptures.length}{" "}
                        {voiceCaptures.length === 1 ? "note" : "notes"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Navigation - Bottom (will conditionally show if height > viewport) */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-t border-flexoki-ui-3">
        <button
          onClick={() => navigateMonth("prev")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Previous Month"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <h2 className="text-lg font-semibold text-flexoki-tx">
          {formatMonthYear()}
        </h2>
        <button
          onClick={() => navigateMonth("next")}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors"
          title="Next Month"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>

      {/* Daily View Modal */}
      <DailyViewModal
        dayData={selectedDayData}
        onClose={() => setSelectedDayData(null)}
      />
    </div>
  );
}
