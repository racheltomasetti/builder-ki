"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import WeeklyView from "@/components/BODY/WeeklyView";
import MonthlyView from "@/components/BODY/MonthlyView";
import WeeklyKey from "@/components/BODY/WeeklyKey";

type ViewMode = "cycle" | "monthly" | "weekly";

type CycleInfo = {
  cycle_day: number | null;
  cycle_phase: string | null;
};

export default function CycleJournalPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchCycleInfo();
  }, []);

  const fetchCycleInfo = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Get today's date in local timezone (not UTC)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(now.getDate()).padStart(2, "0")}`;

      // Fetch cycle info for today
      const { data: cycleData } = await supabase.rpc("calculate_cycle_info", {
        p_user_id: user.id,
        p_date: today,
      });

      setCycleInfo(cycleData);
    } catch (error) {
      console.error("Error fetching cycle info:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCyclePhaseColor = (phase: string | null) => {
    switch (phase) {
      case "menstrual":
        return "text-blue-500";
      case "follicular":
        return "text-green-500";
      case "ovulation":
        return "text-yellow-500";
      case "luteal":
        return "text-orange-500";
      default:
        return "text-flexoki-tx-2";
    }
  };

  const formatPhase = (phase: string | null) => {
    if (!phase) return "No cycle data";
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-flexoki-tx-2">Loading cycle journal...</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="relative mb-4">
          {/* Weekly Key - Left side (only shown in weekly view) */}
          {/* {viewMode === "weekly" && (
            <div className="absolute top-0 left-20">
              <WeeklyKey />
            </div>
          )} */}

          <div className="text-center">
            <h1 className="text-3xl italic font-bold text-flexoki-tx mb-3">
              ~ into the body ~
            </h1>

            {/* View Mode Switcher - Compact */}
            <div className="flex items-center justify-center gap-1 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg p-1 max-w-md mx-auto">
              <button
                onClick={() => setViewMode("weekly")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "weekly"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "monthly"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode("cycle")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "cycle"
                    ? "bg-flexoki-accent text-flexoki-bg"
                    : "text-flexoki-tx-2 hover:bg-flexoki-ui-2"
                }`}
              >
                Cycle
              </button>
            </div>
          </div>

          {/* Current Cycle Info Badge - Positioned absolutely in top right */}
          <div className="absolute top-0 right-0 bg-flexoki-ui rounded-lg border border-flexoki-ui-3 px-4 py-2 flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-flexoki-tx-3 mb-0.5">Day</p>
              <p className="text-lg font-bold text-flexoki-tx">
                {cycleInfo?.cycle_day || "-"}
              </p>
            </div>
            <div className="h-8 w-px bg-flexoki-ui-3"></div>
            <div className="text-center">
              <p className="text-xs text-flexoki-tx-3 mb-0.5">Phase</p>
              <p
                className={`text-sm font-bold ${getCyclePhaseColor(
                  cycleInfo?.cycle_phase || null
                )}`}
              >
                {formatPhase(cycleInfo?.cycle_phase || null)}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-flexoki-ui-3" />
      </div>

      {/* Main Content Area */}
      {viewMode === "weekly" ? (
        <WeeklyView />
      ) : viewMode === "monthly" ? (
        <MonthlyView />
      ) : (
        <div className="bg-flexoki-ui rounded-lg shadow-md p-12">
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🌙</div>
              <h2 className="text-3xl font-bold text-flexoki-tx mb-2">
                28-Day Cycle View
              </h2>
              <p className="text-flexoki-tx-2">
                Circular visualization of your full cycle with data mapped to
                cycle days
              </p>
            </div>
            <div className="bg-flexoki-ui-2 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-flexoki-tx-3 italic">
                View coming soon... This is where you'll visualize your cycle
                data in context with your daily activities, voice captures, and
                patterns.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
