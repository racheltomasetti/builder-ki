import { supabase } from "./supabase";

export interface CyclePeriod {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  flow_intensity: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CycleInfo {
  cycleDay: number | null;
  cyclePhase: string | null;
  currentPeriod: CyclePeriod | null;
}

/**
 * Get current cycle info for the user (cycle day, phase, current period)
 */
export async function getCurrentCycleInfo(userId: string): Promise<CycleInfo> {
  try {
    const today = getTodayDate();

    // Get current ongoing period (if any)
    const { data: currentPeriod, error: currentPeriodError } = await supabase
      .from("cycle_periods")
      .select("*")
      .eq("user_id", userId)
      .is("end_date", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentPeriodError) throw currentPeriodError;

    // Calculate cycle day and phase using the database function
    const { data, error } = await supabase.rpc("calculate_cycle_info", {
      p_user_id: userId,
      p_date: today,
    });

    if (error) {
      console.error("RPC calculate_cycle_info error:", error);
      throw error;
    }

    console.log("Cycle info RPC response:", data);

    return {
      cycleDay: data?.cycle_day || null,
      cyclePhase: data?.cycle_phase || null,
      currentPeriod: currentPeriod || null,
    };
  } catch (error) {
    console.error("Error getting current cycle info:", error);
    return {
      cycleDay: null,
      cyclePhase: null,
      currentPeriod: null,
    };
  }
}

/**
 * Start a new period
 */
export async function startPeriod(
  userId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if there's already an ongoing period
    const { data: existingPeriod } = await supabase
      .from("cycle_periods")
      .select("id")
      .eq("user_id", userId)
      .is("end_date", null)
      .maybeSingle();

    if (existingPeriod) {
      return {
        success: false,
        error: "There is already an ongoing period. Please end it first.",
      };
    }

    // Insert new period
    const { error } = await supabase.from("cycle_periods").insert({
      user_id: userId,
      start_date: date,
      end_date: null,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Error starting period:", error);
    return {
      success: false,
      error: error.message || "Failed to start period",
    };
  }
}

/**
 * End the current ongoing period
 */
export async function endPeriod(
  userId: string,
  periodId: string,
  endDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("cycle_periods")
      .update({ end_date: endDate })
      .eq("id", periodId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Error ending period:", error);
    return {
      success: false,
      error: error.message || "Failed to end period",
    };
  }
}

/**
 * Get recent periods for history display
 */
export async function getRecentPeriods(
  userId: string,
  limit: number = 5
): Promise<CyclePeriod[]> {
  try {
    const { data, error } = await supabase
      .from("cycle_periods")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting recent periods:", error);
    return [];
  }
}

/**
 * Calculate cycle length between two periods
 */
export function calculateCycleLength(
  period1StartDate: string,
  period2StartDate: string
): number {
  const date1 = new Date(period1StartDate);
  const date2 = new Date(period2StartDate);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate period duration (start to end)
 */
export function calculatePeriodDuration(
  startDate: string,
  endDate: string | null
): number | null {
  if (!endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
