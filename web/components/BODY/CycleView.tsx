"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CycleDataPointModal from "./CycleDataPointModal";
import CycleKey from "./CycleKey";

type CyclePeriod = {
  id: string;
  start_date: string;
  end_date: string | null;
  user_id: string;
};

type Capture = {
  id: string;
  type: string;
  note_type: string;
  transcription: string | null;
  file_url: string | null;
  created_at: string;
  log_date: string;
  cycle_day: number | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  caption: string | null;
  original_date: string;
  log_date: string | null;
  created_at: string;
};

type DataPoint = {
  id: string;
  type: "intention" | "reflection" | "general" | "media";
  cycleDay: number;
  timeOfDay: number; // 0-24 (decimal hours)
  color: string;
  data: Capture | MediaItem; // Original data for modal
};

export default function CycleView() {
  const [cycles, setCycles] = useState<CyclePeriod[]>([]);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPhaseOverlay, setShowPhaseOverlay] = useState(true);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(
    null
  );
  const [isAllTimeView, setIsAllTimeView] = useState(false);
  const [earliestCycleWithCapturesIndex, setEarliestCycleWithCapturesIndex] =
    useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (cycles.length > 0) {
      if (isAllTimeView) {
        fetchAllTimeData();
      } else {
        fetchCycleData();
      }
    }
  }, [currentCycleIndex, cycles, isAllTimeView]);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all cycle periods, ordered by start_date descending (most recent first)
      const { data: cyclePeriods, error } = await supabase
        .from("cycle_periods")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching cycles:", error);
        return;
      }

      setCycles(cyclePeriods || []);
      setCurrentCycleIndex(0); // Start with most recent cycle
    } catch (error) {
      console.error("Error fetching cycles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleData = async () => {
    try {
      setLoadingData(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const currentCycle = getCurrentCycle();
      if (!currentCycle) return;

      const cycleStartDate = currentCycle.start_date;
      const cycleEndDate =
        currentCycle.end_date || new Date().toISOString().split("T")[0];

      // Fetch all captures for this cycle
      const { data: captures } = await supabase
        .from("captures")
        .select("*")
        .eq("user_id", user.id)
        .gte("log_date", cycleStartDate)
        .lte("log_date", cycleEndDate)
        .order("created_at", { ascending: true });

      // Fetch all media items for this cycle
      const { data: media } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .or(
          `original_date.gte.${cycleStartDate},log_date.gte.${cycleStartDate}`
        )
        .or(`original_date.lte.${cycleEndDate},log_date.lte.${cycleEndDate}`)
        .order("created_at", { ascending: true });

      // Process captures into data points
      const capturePoints: DataPoint[] =
        captures?.map((capture) => {
          const cycleDay = calculateCycleDay(cycleStartDate, capture.log_date);
          const timeOfDay = extractTimeOfDay(capture.created_at);

          let type: "intention" | "reflection" | "general" = "general";
          let color = "#D47474"; // red accent (general)

          if (capture.note_type === "intention") {
            type = "intention";
            color = "#D4A574"; // yellow/gold
          } else if (capture.note_type === "reflection") {
            type = "reflection";
            color = "#A274D4"; // purple
          }

          return {
            id: capture.id,
            type,
            cycleDay,
            timeOfDay,
            color,
            data: capture,
          };
        }) || [];

      // Process media items into data points
      const mediaPoints: DataPoint[] =
        media?.map((item) => {
          const dateToUse =
            item.original_date || item.log_date || item.created_at;
          const cycleDay = calculateCycleDay(cycleStartDate, dateToUse);
          const timeOfDay = extractTimeOfDay(item.created_at);

          return {
            id: item.id,
            type: "media",
            cycleDay,
            timeOfDay,
            color: "#74D4A5", // teal accent-2
            data: item,
          };
        }) || [];

      // Combine all data points
      const allPoints = [...capturePoints, ...mediaPoints];
      setDataPoints(allPoints);

      console.log("Data points loaded:", allPoints.length);
      console.log("Sample data points:", allPoints.slice(0, 3));
    } catch (error) {
      console.error("Error fetching cycle data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAllTimeData = async () => {
    try {
      setLoadingData(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all captures for all time
      const { data: captures, error: capturesError } = await supabase
        .from("captures")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: true });

      if (capturesError) {
        console.error("Error fetching captures:", capturesError);
      }

      // Fetch all media items for all time
      const { data: media, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (mediaError) {
        console.error("Error fetching media:", mediaError);
      }

      // Find earliest and latest dates for radial positioning
      const allDates: Date[] = [];

      captures?.forEach((capture) => {
        if (capture.log_date) {
          const logDate = capture.log_date.split("T")[0];
          allDates.push(new Date(logDate + "T00:00:00"));
        }
      });

      media?.forEach((item) => {
        const dateToUse =
          item.original_date || item.log_date || item.created_at;
        if (dateToUse) {
          const dateStr = dateToUse.split("T")[0];
          allDates.push(new Date(dateStr + "T00:00:00"));
        }
      });

      if (allDates.length === 0) {
        setDataPoints([]);
        return;
      }

      const earliestDate = new Date(
        Math.min(...allDates.map((d) => d.getTime()))
      );
      const latestDate = new Date(
        Math.max(...allDates.map((d) => d.getTime()))
      );
      const earliestTimestamp = earliestDate.getTime();
      const latestTimestamp = latestDate.getTime();
      const timeRange = latestTimestamp - earliestTimestamp;

      // Helper function to find which cycle a date belongs to and calculate cycle day
      const findCycleDayForDate = (
        dateStr: string,
        itemId?: string
      ): number | null => {
        const itemDate = new Date(dateStr + "T00:00:00");

        // Search cycles in order (they're already sorted by start_date descending - newest first)
        for (let i = 0; i < cycles.length; i++) {
          const cycle = cycles[i];
          const cycleStart = new Date(cycle.start_date + "T00:00:00");

          // For completed cycles, use end_date
          if (cycle.end_date) {
            const cycleEnd = new Date(cycle.end_date + "T00:00:00");

            // Check if item falls within this cycle (inclusive of start, exclusive of end)
            if (itemDate >= cycleStart && itemDate < cycleEnd) {
              const diffTime = itemDate.getTime() - cycleStart.getTime();
              const cycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

              // Only log for the problematic item
              if (itemId === "2eef8f47-7bf7-4218-863d-260cd0680de3") {
                console.log(
                  `[DEBUG] Item ${itemId} (${dateStr}) matched to Cycle #${i}: ${cycle.start_date} to ${cycle.end_date}, Day ${cycleDay}`
                );
              }

              return cycleDay;
            }
          } else {
            // For ongoing cycle (no end_date)
            // Check if this is the most recent cycle (first in the list)
            // AND if the item date is on or after the cycle start
            // AND (either there's no next cycle OR the date is after the next cycle's end)

            const nextCycle = cycles[i + 1]; // Next cycle in the list (older)

            if (itemDate >= cycleStart) {
              // Make sure this date doesn't belong to a previous cycle
              if (nextCycle && nextCycle.end_date) {
                const nextCycleEnd = new Date(nextCycle.end_date + "T00:00:00");
                // If the date is before the previous cycle ended, skip this ongoing cycle
                if (itemDate < nextCycleEnd) {
                  if (itemId === "2eef8f47-7bf7-4218-863d-260cd0680de3") {
                    console.log(
                      `[DEBUG] Item ${itemId} (${dateStr}) skipping ongoing cycle #${i} because date < next cycle end (${nextCycleEnd.toISOString()})`
                    );
                  }
                  continue; // Keep searching in older cycles
                }
              }

              // This date belongs to the current ongoing cycle
              const diffTime = itemDate.getTime() - cycleStart.getTime();
              const cycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

              if (itemId === "2eef8f47-7bf7-4218-863d-260cd0680de3") {
                console.log(
                  `[DEBUG] Item ${itemId} (${dateStr}) matched to ONGOING Cycle #${i}: ${cycle.start_date}, Day ${cycleDay}`
                );
              }

              return cycleDay;
            }
          }
        }

        return null; // Date doesn't belong to any cycle
      };

      // Helper function to calculate radial position (0-1, where 0 is outer/earliest, 1 is inner/latest)
      const calculateRadialPosition = (dateStr: string): number => {
        const itemDate = new Date(dateStr + "T00:00:00");
        const timestamp = itemDate.getTime();

        if (timeRange === 0) return 0.5; // All data on same date, position in middle

        // Normalize to 0-1 range (0 = earliest/outer, 1 = latest/inner)
        return (timestamp - earliestTimestamp) / timeRange;
      };

      // Process captures into data points
      const capturePoints: DataPoint[] =
        (captures
          ?.filter((capture) => capture.log_date)
          .map((capture) => {
            const logDate = capture.log_date.split("T")[0];
            const cycleDay = findCycleDayForDate(logDate, capture.id);

            // Skip captures that don't belong to any cycle
            if (cycleDay === null) return null;

            const radialPosition = calculateRadialPosition(logDate);

            let type: "intention" | "reflection" | "general" = "general";
            let color = "#D47474"; // red accent (general)

            if (capture.note_type === "intention") {
              type = "intention";
              color = "#D4A574"; // yellow/gold
            } else if (capture.note_type === "reflection") {
              type = "reflection";
              color = "#A274D4"; // purple
            }

            return {
              id: capture.id,
              type,
              cycleDay,
              timeOfDay: radialPosition, // Repurpose timeOfDay field for radial position
              color,
              data: capture,
            };
          })
          .filter((point) => point !== null) as DataPoint[]) || [];

      // Process media items into data points
      const mediaPoints: DataPoint[] =
        (media
          ?.map((item) => {
            // Determine which date to use (prioritize original_date, then log_date, then created_at)
            const dateToUse =
              item.original_date || item.log_date || item.created_at;

            // Skip if no valid date
            if (!dateToUse) {
              console.warn(`Media item ${item.id} has no valid date, skipping`);
              return null;
            }

            const dateStr = dateToUse.split("T")[0];
            const cycleDay = findCycleDayForDate(dateStr, item.id);

            // Skip media that don't belong to any cycle
            if (cycleDay === null) {
              return null;
            }

            const radialPosition = calculateRadialPosition(dateStr);

            return {
              id: item.id,
              type: "media",
              cycleDay,
              timeOfDay: radialPosition, // Repurpose timeOfDay field for radial position
              color: "#74D4A5", // teal accent-2
              data: item,
            };
          })
          .filter((point) => point !== null) as DataPoint[]) || [];

      // Helper function to get the date used for sorting
      const getDateForSorting = (data: Capture | MediaItem): string => {
        // Check if it's a Capture by looking for note_type (unique to Capture)
        if ("note_type" in data) {
          return data.log_date;
        } else {
          // It's a MediaItem
          const mediaItem = data as MediaItem;
          return (
            mediaItem.original_date ||
            mediaItem.log_date ||
            mediaItem.created_at
          );
        }
      };

      // Combine all data points
      const allPoints = [...capturePoints, ...mediaPoints];

      // Sort chronologically by the date used for positioning
      // (earliest to latest, so outer ring to inner ring)
      allPoints.sort((a, b) => {
        const dateA = getDateForSorting(a.data);
        const dateB = getDateForSorting(b.data);
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });

      setDataPoints(allPoints);
    } catch (error) {
      console.error("Error fetching all-time data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const calculateCycleDay = (
    cycleStartDate: string,
    itemDate: string
  ): number => {
    const start = new Date(cycleStartDate + "T00:00:00");
    const item = new Date(itemDate + "T00:00:00");
    const diffTime = item.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is start date
    return diffDays;
  };

  const extractTimeOfDay = (timestamp: string): number => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours + minutes / 60; // Return decimal hours (e.g., 14.5 = 2:30 PM)
  };

  const navigateCycle = (direction: "prev" | "next") => {
    if (direction === "prev" && currentCycleIndex < cycles.length - 1) {
      setCurrentCycleIndex(currentCycleIndex + 1);
    } else if (direction === "next" && currentCycleIndex > 0) {
      setCurrentCycleIndex(currentCycleIndex - 1);
    }
  };

  const getCurrentCycle = (): CyclePeriod | null => {
    return cycles[currentCycleIndex] || null;
  };

  const getCycleLength = (cycle: CyclePeriod): number => {
    // If cycle is complete (has end_date), calculate actual length
    if (cycle.end_date) {
      const start = new Date(cycle.start_date + "T00:00:00");
      const end = new Date(cycle.end_date + "T00:00:00");
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    // For in-progress cycles, use average of last 3 completed cycles
    const completedCycles = cycles.filter((c) => c.end_date !== null);
    if (completedCycles.length > 0) {
      const recentCompleted = completedCycles.slice(0, 3);
      const totalLength = recentCompleted.reduce((sum, c) => {
        const start = new Date(c.start_date + "T00:00:00");
        const end = new Date(c.end_date! + "T00:00:00");
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      return Math.round(totalLength / recentCompleted.length);
    }

    // Fallback to 28 days for new users
    return 28;
  };

  const getCurrentCycleDay = (cycle: CyclePeriod): number => {
    // Force local timezone interpretation
    const start = new Date(cycle.start_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight local time

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because day 1 is the start date
    return diffDays;
  };

  const formatCycleDateRange = (cycle: CyclePeriod): string => {
    // Force local timezone interpretation by appending time
    const startDate = new Date(cycle.start_date + "T00:00:00");
    const startFormatted = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    if (cycle.end_date) {
      const endDate = new Date(cycle.end_date + "T00:00:00");
      const endFormatted = endDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startFormatted} - ${endFormatted}`;
    } else {
      // In-progress cycle
      return `${startFormatted} - Current`;
    }
  };

  const isCurrentCycle = (cycle: CyclePeriod): boolean => {
    return !cycle.end_date; // Current cycle has no end date
  };

  const handleDataPointNavigation = (direction: "prev" | "next") => {
    if (!selectedDataPoint) return;

    const currentIndex = dataPoints.findIndex(
      (dp) => dp.id === selectedDataPoint.id
    );

    if (direction === "prev" && currentIndex > 0) {
      setSelectedDataPoint(dataPoints[currentIndex - 1]);
    } else if (direction === "next" && currentIndex < dataPoints.length - 1) {
      setSelectedDataPoint(dataPoints[currentIndex + 1]);
    }
  };

  const getEarliestCycleWithCaptures = async (): Promise<number | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Check each cycle from oldest to newest for captures
      for (let i = cycles.length - 1; i >= 0; i--) {
        const cycle = cycles[i];
        const cycleStartDate = cycle.start_date;
        const cycleEndDate =
          cycle.end_date || new Date().toISOString().split("T")[0];

        // Check if this cycle has any captures
        const { data: captures, error: capturesError } = await supabase
          .from("captures")
          .select("id")
          .eq("user_id", user.id)
          .gte("log_date", cycleStartDate)
          .lte("log_date", cycleEndDate)
          .limit(1);

        // Check if this cycle has any media items
        const { data: media, error: mediaError } = await supabase
          .from("media_items")
          .select("id")
          .eq("user_id", user.id)
          .or(
            `original_date.gte.${cycleStartDate},log_date.gte.${cycleStartDate}`
          )
          .or(`original_date.lte.${cycleEndDate},log_date.lte.${cycleEndDate}`)
          .limit(1);

        // If this cycle has captures or media, return its index
        if ((captures && captures.length > 0) || (media && media.length > 0)) {
          return i;
        }
      }

      return null; // No cycles with captures found
    } catch (error) {
      console.error("Error finding earliest cycle with captures:", error);
      return null;
    }
  };

  const handleJumpToEarliestCycleWithCaptures = async () => {
    const earliestIndex = await getEarliestCycleWithCaptures();
    if (earliestIndex !== null) {
      setIsAllTimeView(false); // Exit All Time view
      setEarliestCycleWithCapturesIndex(earliestIndex); // Store the index
      setCurrentCycleIndex(earliestIndex);
    }
  };

  const handleJumpToCurrentCycle = () => {
    setIsAllTimeView(false); // Exit All Time view
    setCurrentCycleIndex(0);
  };

  const handleToggleAllTimeView = () => {
    setIsAllTimeView(!isAllTimeView);
  };

  const getCyclePhaseForDay = (cycleDay: number): string => {
    if (cycleDay >= 1 && cycleDay <= 5) return "menstrual";
    if (cycleDay >= 6 && cycleDay <= 13) return "follicular";
    if (cycleDay >= 14 && cycleDay <= 15) return "ovulation";
    if (cycleDay >= 16 && cycleDay <= 28) return "luteal";
    // For cycles longer than 28 days, extend luteal phase
    if (cycleDay > 28) return "luteal";
    return "follicular"; // fallback
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case "menstrual":
        return "#3b82f6"; // blue-500
      case "follicular":
        return "#22c55e"; // green-500
      case "ovulation":
        return "#eab308"; // yellow-500
      case "luteal":
        return "#f97316"; // orange-500
      default:
        return "#d4d4d8"; // neutral
    }
  };

  const calculatePolarPosition = (
    cycleDay: number,
    timeOfDay: number,
    totalCycleDays: number,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    trackPosition: "voice" | "media", // Track 1 or Track 2
    isAllTime: boolean = false
  ): { x: number; y: number } => {
    // Calculate angle based on cycle day and track position within slice
    // Day 1 starts at top (12 o'clock = -90 degrees), progresses clockwise
    const anglePerDay = (2 * Math.PI) / totalCycleDays;

    // Base angle for the start of this day's slice
    const baseAngle = (cycleDay - 1) * anglePerDay - Math.PI / 2;

    // Offset within the slice based on track
    // Track 1 (voice) at 1/3 of slice width, Track 2 (media) at 2/3 of slice width
    const trackOffset =
      trackPosition === "voice" ? anglePerDay * (1 / 3) : anglePerDay * (2 / 3);

    const angle = baseAngle + trackOffset;

    // Calculate radius based on mode
    const radiusRange = outerRadius - innerRadius;
    let radius: number;

    if (isAllTime) {
      // In All Time view: timeOfDay is actually radialPosition (0-1)
      // 0 = earliest/outer, 1 = latest/inner
      // Invert it so 0 maps to outerRadius and 1 maps to innerRadius
      radius = outerRadius - timeOfDay * radiusRange;
    } else {
      // In single cycle view: timeOfDay is 0-24 (decimal hours)
      // 0 (midnight) = innerRadius, 24 (midnight next day) = outerRadius
      radius = innerRadius + (timeOfDay / 24) * radiusRange;
    }

    // Convert polar to cartesian coordinates
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return { x, y };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-flexoki-tx-2">Loading cycle view...</p>
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-flexoki-ui rounded-xl shadow-lg border border-flexoki-ui-3">
        <div className="text-center">
          <p className="text-flexoki-tx-2 mb-2">No cycle data available</p>
          <p className="text-sm text-flexoki-tx-3">
            Log your first period to start tracking cycles
          </p>
        </div>
      </div>
    );
  }

  const currentCycle = getCurrentCycle();
  if (!currentCycle && !isAllTimeView) return null;

  // Calculate cycle length based on view mode
  let cycleLength: number;
  if (isAllTimeView) {
    // For All Time view, use the longest cycle length in the system
    if (cycles.length > 0) {
      const cycleLengths = cycles.map((cycle) => {
        if (cycle.end_date) {
          const start = new Date(cycle.start_date + "T00:00:00");
          const end = new Date(cycle.end_date + "T00:00:00");
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const length = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return length;
        }
        return 28; // Default for incomplete cycles
      });
      cycleLength = Math.max(...cycleLengths, 28); // Use longest cycle, minimum 28
    } else {
      cycleLength = 28; // Default fallback
    }
  } else if (currentCycle) {
    cycleLength = getCycleLength(currentCycle);
  } else {
    cycleLength = 28; // Default fallback
  }

  const currentDay =
    !isAllTimeView && currentCycle && isCurrentCycle(currentCycle)
      ? getCurrentCycleDay(currentCycle)
      : null;

  return (
    <div className="bg-flexoki-ui rounded-xl shadow-lg border border-flexoki-ui-3 overflow-hidden">
      {/* Legend - Top */}
      <div className="px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <CycleKey
          showPhaseOverlay={showPhaseOverlay}
          onTogglePhaseOverlay={setShowPhaseOverlay}
          onJumpToCurrentCycle={handleJumpToCurrentCycle}
          onJumpToEarliestCycle={handleJumpToEarliestCycleWithCaptures}
          onToggleAllTimeView={handleToggleAllTimeView}
          isAtCurrentCycle={currentCycleIndex === 0}
          isAtEarliestCycle={
            earliestCycleWithCapturesIndex !== null &&
            currentCycleIndex === earliestCycleWithCapturesIndex
          }
          isAllTimeView={isAllTimeView}
        />
      </div>

      {/* Header with Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-b border-flexoki-ui-3">
        <button
          onClick={() => navigateCycle("prev")}
          disabled={currentCycleIndex >= cycles.length - 1 || isAllTimeView}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Cycle"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <div className="text-center">
          {/* horizontal line */}
          <div className="w-full h-1 bg-flexoki-ui-3"></div>
          <h2 className="text-lg font-semibold text-flexoki-tx">
            {isAllTimeView
              ? "All Time View"
              : currentCycle
              ? formatCycleDateRange(currentCycle)
              : "No Cycle"}
          </h2>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center justify-center gap-3 text-sm text-flexoki-tx-3">
              {!loadingData && (
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-flexoki-tx-3"></span>
                  <span>
                    {dataPoints.length}{" "}
                    {dataPoints.length === 1 ? "capture" : "captures"}
                  </span>
                </span>
              )}
            </div>
            {/* horizontal line */}
            <div className="w-full h-1 bg-flexoki-ui-3"></div>
            {/* Today's date - only show if viewing current cycle */}
            {!isAllTimeView && currentCycle && isCurrentCycle(currentCycle) && (
              <p className="text-sm text-flexoki-accent italic font-semibold">
                Today is{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigateCycle("next")}
          disabled={currentCycleIndex <= 0 || isAllTimeView}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Cycle"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>

      {/* SVG Cycle Wheel */}
      <div className="p-8 flex items-center justify-center relative">
        {loadingData && (
          <div className="absolute inset-0 flex items-center justify-center bg-flexoki-ui bg-opacity-80 z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-flexoki-ui-3 border-t-flexoki-accent mx-auto mb-2"></div>
              <p className="text-flexoki-tx-2 text-sm">Loading cycle data...</p>
            </div>
          </div>
        )}
        <svg
          viewBox="0 0 800 800"
          className="w-full max-w-2xl"
          style={{ maxHeight: "600px" }}
        >
          {/* Define constants */}
          {(() => {
            const centerX = 400;
            const centerY = 400;
            const outerRadius = 350;
            const innerRadius = 100;
            const anglePerDay = (2 * Math.PI) / cycleLength;

            return (
              <>
                {/* Background circle */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={outerRadius}
                  fill="#E6E4DE"
                  className="opacity-20"
                />

                {/* Phase overlay segments (when enabled and not in All Time view) */}
                {showPhaseOverlay &&
                  !isAllTimeView &&
                  Array.from({ length: cycleLength }, (_, i) => {
                    const day = i + 1;
                    const phase = getCyclePhaseForDay(day);
                    const phaseColor = getPhaseColor(phase);

                    // Calculate start and end angles (start at top = -90deg, go clockwise)
                    const startAngle = i * anglePerDay - Math.PI / 2;
                    const endAngle = (i + 1) * anglePerDay - Math.PI / 2;

                    // Calculate path for segment (pizza slice)
                    const x1 = centerX + innerRadius * Math.cos(startAngle);
                    const y1 = centerY + innerRadius * Math.sin(startAngle);
                    const x2 = centerX + outerRadius * Math.cos(startAngle);
                    const y2 = centerY + outerRadius * Math.sin(startAngle);
                    const x3 = centerX + outerRadius * Math.cos(endAngle);
                    const y3 = centerY + outerRadius * Math.sin(endAngle);
                    const x4 = centerX + innerRadius * Math.cos(endAngle);
                    const y4 = centerY + innerRadius * Math.sin(endAngle);

                    const largeArcFlag = anglePerDay > Math.PI ? 1 : 0;

                    const pathData = `
                      M ${x1} ${y1}
                      L ${x2} ${y2}
                      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
                      L ${x4} ${y4}
                      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
                      Z
                    `;

                    return (
                      <path
                        key={`segment-${day}`}
                        d={pathData}
                        fill={phaseColor}
                        opacity="0.3"
                        stroke="none"
                      />
                    );
                  })}

                {/* Day divider lines */}
                {Array.from({ length: cycleLength }, (_, i) => {
                  const angle = i * anglePerDay - Math.PI / 2;
                  const x1 = centerX + innerRadius * Math.cos(angle);
                  const y1 = centerY + innerRadius * Math.sin(angle);
                  const x2 = centerX + outerRadius * Math.cos(angle);
                  const y2 = centerY + outerRadius * Math.sin(angle);

                  return (
                    <line
                      key={`divider-${i}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#ADA9A0"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  );
                })}

                {/* Day number labels */}
                {Array.from({ length: cycleLength }, (_, i) => {
                  const day = i + 1;
                  const angle = (i + 0.5) * anglePerDay - Math.PI / 2; // Center of segment
                  const labelRadius = outerRadius + 25; // Outside the circle
                  const x = centerX + labelRadius * Math.cos(angle);
                  const y = centerY + labelRadius * Math.sin(angle);

                  // Only show every 2nd or 3rd label to avoid clutter
                  const showLabel =
                    day === 1 ||
                    day === cycleLength ||
                    day % (cycleLength > 28 ? 4 : 3) === 0;

                  if (!showLabel) return null;

                  return (
                    <text
                      key={`label-${day}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-flexoki-tx-3"
                      fontWeight="500"
                    >
                      {day}
                    </text>
                  );
                })}

                {/* Current day indicator (glow effect) - only show in single cycle view */}
                {!isAllTimeView && currentDay && currentDay <= cycleLength && (
                  <>
                    {(() => {
                      const dayIndex = currentDay - 1;
                      const startAngle = dayIndex * anglePerDay - Math.PI / 2;
                      const endAngle =
                        (dayIndex + 1) * anglePerDay - Math.PI / 2;
                      const midAngle = (startAngle + endAngle) / 2;

                      // Calculate path for current day segment
                      const x1 = centerX + innerRadius * Math.cos(startAngle);
                      const y1 = centerY + innerRadius * Math.sin(startAngle);
                      const x2 = centerX + outerRadius * Math.cos(startAngle);
                      const y2 = centerY + outerRadius * Math.sin(startAngle);
                      const x3 = centerX + outerRadius * Math.cos(endAngle);
                      const y3 = centerY + outerRadius * Math.sin(endAngle);
                      const x4 = centerX + innerRadius * Math.cos(endAngle);
                      const y4 = centerY + innerRadius * Math.sin(endAngle);

                      const largeArcFlag = anglePerDay > Math.PI ? 1 : 0;

                      const pathData = `
                        M ${x1} ${y1}
                        L ${x2} ${y2}
                        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
                        L ${x4} ${y4}
                        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
                        Z
                      `;

                      return (
                        <>
                          {/* Glow effect */}
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur
                                stdDeviation="4"
                                result="coloredBlur"
                              />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#D4A574"
                            strokeWidth="4"
                            opacity="0.8"
                            filter="url(#glow)"
                          />
                        </>
                      );
                    })()}
                  </>
                )}

                {/* Outer and inner circle outlines */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={outerRadius}
                  fill="none"
                  stroke="#ADA9A0"
                  strokeWidth="2"
                />
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={innerRadius}
                  fill="none"
                  stroke="#ADA9A0"
                  strokeWidth="2"
                />

                {/* Center circle with current day info - only show in single cycle view */}
                {!isAllTimeView && currentDay && currentDay <= cycleLength && (
                  <>
                    {/* Clickable background circle */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={innerRadius - 10}
                      fill="#E6E4DE"
                      className="cursor-pointer transition-all hover:opacity-80"
                      opacity="0.6"
                      onClick={() => {
                        // TODO: Open phase info modal
                        console.log(
                          "Center circle clicked - open phase info modal"
                        );
                      }}
                    />

                    {/* Current day text */}
                    <text
                      x={centerX}
                      y={centerY - 15}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-flexoki-accent text-3xl font-bold cursor-pointer"
                      onClick={() => {
                        // TODO: Open phase info modal
                        console.log(
                          "Center text clicked - open phase info modal"
                        );
                      }}
                    >
                      Day {currentDay}
                    </text>

                    {/* Current phase text */}
                    <text
                      x={centerX}
                      y={centerY + 25}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-flexoki-tx text-lg capitalize italic cursor-pointer"
                      onClick={() => {
                        // TODO: Open phase info modal
                        console.log(
                          "Center text clicked - open phase info modal"
                        );
                      }}
                    >
                      {getCyclePhaseForDay(currentDay)}
                    </text>
                  </>
                )}

                {/* Data points */}
                {dataPoints.map((point) => {
                  // Skip points outside the cycle range
                  if (point.cycleDay < 1 || point.cycleDay > cycleLength) {
                    return null;
                  }

                  // Determine track based on type
                  const track = point.type === "media" ? "media" : "voice";

                  const position = calculatePolarPosition(
                    point.cycleDay,
                    point.timeOfDay,
                    cycleLength,
                    centerX,
                    centerY,
                    innerRadius,
                    outerRadius,
                    track,
                    isAllTimeView
                  );

                  return (
                    <circle
                      key={point.id}
                      cx={position.x}
                      cy={position.y}
                      r="6"
                      fill={point.color}
                      stroke="white"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-all hover:scale-125 hover:opacity-100"
                      opacity="0.85"
                      style={{
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                        transformOrigin: `${position.x}px ${position.y}px`,
                      }}
                      onClick={() => {
                        // Log diagnostic info when clicking a point
                        const pointData = point.data as Capture | MediaItem;

                        // Use the same date priority as fetchAllTimeData
                        let logDate: string | null;
                        // Check if it's a Capture by looking for note_type (unique to Capture)
                        if ("note_type" in pointData) {
                          // For captures, use log_date
                          logDate = pointData.log_date;
                        } else {
                          // For media, use original_date > log_date > created_at (same as fetchAllTimeData)
                          const mediaItem = pointData as MediaItem;
                          logDate =
                            mediaItem.original_date ||
                            mediaItem.log_date ||
                            mediaItem.created_at;
                        }

                        console.log("=== CLICKED DATA POINT ===");
                        console.log("Point ID:", point.id);
                        console.log("Point Type:", point.type);

                        // Show all date fields for media items
                        if (point.type === "media") {
                          const mediaItem = pointData as MediaItem;
                          console.log("Media Date Fields:");
                          console.log(
                            "  - original_date:",
                            mediaItem.original_date
                          );
                          console.log("  - log_date:", mediaItem.log_date);
                          console.log("  - created_at:", mediaItem.created_at);
                          console.log(
                            "  - Used Date (priority: original > log > created):",
                            logDate
                          );
                        } else {
                          console.log("Capture log_date:", logDate);
                        }

                        console.log("Displayed as Cycle Day:", point.cycleDay);

                        if (logDate) {
                          // Find which cycle this should belong to
                          const itemDate = new Date(
                            logDate.split("T")[0] + "T00:00:00"
                          );
                          console.log("Looking for matching cycle...");

                          cycles.forEach((cycle, idx) => {
                            const cycleStart = new Date(
                              cycle.start_date + "T00:00:00"
                            );
                            const cycleEnd = cycle.end_date
                              ? new Date(cycle.end_date + "T00:00:00")
                              : null;

                            if (cycleEnd) {
                              if (
                                itemDate >= cycleStart &&
                                itemDate < cycleEnd
                              ) {
                                const diffTime =
                                  itemDate.getTime() - cycleStart.getTime();
                                const calculatedDay =
                                  Math.floor(diffTime / (1000 * 60 * 60 * 24)) +
                                  1;
                                console.log(
                                  `✓ MATCHES Cycle #${idx}: ${cycle.start_date} to ${cycle.end_date}`
                                );
                                console.log(
                                  `  Calculated Day: ${calculatedDay}`
                                );
                              }
                            } else {
                              if (itemDate >= cycleStart) {
                                const diffTime =
                                  itemDate.getTime() - cycleStart.getTime();
                                const calculatedDay =
                                  Math.floor(diffTime / (1000 * 60 * 60 * 24)) +
                                  1;
                                console.log(
                                  `✓ MATCHES Current Cycle #${idx}: ${cycle.start_date} to ongoing`
                                );
                                console.log(
                                  `  Calculated Day: ${calculatedDay}`
                                );
                              }
                            }
                          });
                        } else {
                          console.log("⚠️ ERROR: This item has no valid date!");
                          console.log("Raw data:", pointData);
                        }
                        console.log("=========================");

                        setSelectedDataPoint(point);
                      }}
                    />
                  );
                })}

                {/* Empty state message when no data points */}
                {!loadingData && dataPoints.length === 0 && (
                  <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-flexoki-tx-3 text-lg"
                  >
                    {isAllTimeView
                      ? "No captures available"
                      : "No captures for this cycle"}
                  </text>
                )}
              </>
            );
          })()}
        </svg>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-flexoki-ui-2 border-t border-flexoki-ui-3">
        <button
          onClick={() => navigateCycle("prev")}
          disabled={currentCycleIndex >= cycles.length - 1 || isAllTimeView}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Cycle"
        >
          <ChevronLeft className="w-5 h-5 text-flexoki-tx" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-flexoki-tx">
            {isAllTimeView
              ? "All Time View"
              : currentCycle
              ? formatCycleDateRange(currentCycle)
              : "No Cycle"}
          </h2>
        </div>
        <button
          onClick={() => navigateCycle("next")}
          disabled={currentCycleIndex <= 0 || isAllTimeView}
          className="p-1 rounded-lg hover:bg-flexoki-ui transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Cycle"
        >
          <ChevronRight className="w-5 h-5 text-flexoki-tx" />
        </button>
      </div>

      {/* Data Point Modal */}
      <CycleDataPointModal
        dataPoint={selectedDataPoint}
        cyclePhase={
          selectedDataPoint
            ? getCyclePhaseForDay(selectedDataPoint.cycleDay)
            : null
        }
        allDataPoints={dataPoints}
        onClose={() => setSelectedDataPoint(null)}
        onNavigate={handleDataPointNavigation}
      />
    </div>
  );
}
