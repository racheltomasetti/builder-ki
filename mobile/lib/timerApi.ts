import { supabase } from "./supabase";

/**
 * Timer API - Centralized functions for timer_sessions management
 */

export interface TimerSession {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  status: "active" | "paused" | "completed";
  cycle_day: number | null;
  cycle_phase: string | null;
  log_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveTimer {
  id: string;
  taskId: string;
  taskName: string;
  startTime: Date;
  elapsedSeconds: number;
}

/**
 * Get all active timer IDs for a user (used for linking captures)
 */
export async function getActiveTimerIds(userId: string): Promise<string[]> {
  try {
    console.log("Fetching active timer IDs...");
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching active timers:", error);
      return [];
    }

    const timerIds = data?.map((timer) => timer.id) || [];
    console.log("Found active timers:", timerIds.length);
    return timerIds;
  } catch (err) {
    console.error("Error in getActiveTimerIds:", err);
    return [];
  }
}

/**
 * Get all active timer sessions with full details (used for Active Timer Bar)
 */
export async function getActiveTimers(
  userId: string,
  taskDate: string
): Promise<ActiveTimer[]> {
  try {
    // Load active timer sessions
    const { data: activeSessions, error: timerError } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("end_time", null);

    if (timerError) throw timerError;

    if (!activeSessions || activeSessions.length === 0) {
      return [];
    }

    // Load today's tasks to find task names
    const { data: todayTasks, error: taskError } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", taskDate);

    if (taskError) throw taskError;

    // Convert to ActiveTimer format
    const timers: ActiveTimer[] = [];
    for (const session of activeSessions) {
      const task = todayTasks?.find(
        (t: any) => t.timer_session_id === session.id
      );
      if (task) {
        timers.push({
          id: session.id,
          taskId: task.id,
          taskName: task.task_description,
          startTime: new Date(session.start_time),
          elapsedSeconds: Math.floor(
            (new Date().getTime() - new Date(session.start_time).getTime()) /
              1000
          ),
        });
      }
    }

    return timers;
  } catch (err) {
    console.error("Error loading active timers:", err);
    return [];
  }
}

/**
 * Start a new timer session for a task
 */
export async function startTimer(
  userId: string,
  taskName: string,
  taskId?: string
): Promise<TimerSession | null> {
  try {
    // Get current date in device's local timezone (YYYY-MM-DD format)
    const now = new Date();
    const logDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    // Create timer session
    const { data: timerSession, error: timerError } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: userId,
        name: taskName,
        start_time: now.toISOString(),
        log_date: logDate,
        status: "active",
      })
      .select()
      .single();

    if (timerError) throw timerError;

    // If taskId provided, update task status and link to timer
    if (taskId) {
      const { error: taskError } = await supabase
        .from("daily_tasks")
        .update({
          status: "in_progress",
          timer_session_id: timerSession.id,
        })
        .eq("id", taskId);

      if (taskError) throw taskError;
    }

    console.log("Timer started:", taskName);
    return timerSession;
  } catch (err: any) {
    console.error("Error starting timer:", err);
    throw err;
  }
}

/**
 * Stop a timer session
 */
export async function stopTimer(
  timerId: string,
  taskId?: string
): Promise<void> {
  try {
    // Update timer session with end time
    const { error: timerError } = await supabase
      .from("timer_sessions")
      .update({
        end_time: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", timerId);

    if (timerError) throw timerError;

    // If taskId provided, update task status to completed
    if (taskId) {
      const { error: taskError } = await supabase
        .from("daily_tasks")
        .update({
          status: "completed",
        })
        .eq("id", taskId);

      if (taskError) throw taskError;
    }

    console.log("Timer stopped:", timerId);
  } catch (err: any) {
    console.error("Error stopping timer:", err);
    throw err;
  }
}

/**
 * Pause a timer session (optional - not in MVP)
 */
export async function pauseTimer(timerId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("timer_sessions")
      .update({
        status: "paused",
      })
      .eq("id", timerId);

    if (error) throw error;

    console.log("Timer paused:", timerId);
  } catch (err: any) {
    console.error("Error pausing timer:", err);
    throw err;
  }
}

/**
 * Resume a paused timer session (optional - not in MVP)
 */
export async function resumeTimer(timerId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("timer_sessions")
      .update({
        status: "active",
      })
      .eq("id", timerId);

    if (error) throw error;

    console.log("Timer resumed:", timerId);
  } catch (err: any) {
    console.error("Error resuming timer:", err);
    throw err;
  }
}

/**
 * Get timer session by ID
 */
export async function getTimerSessionById(
  timerId: string
): Promise<TimerSession | null> {
  try {
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("id", timerId)
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("Error fetching timer session:", err);
    return null;
  }
}

/**
 * Get timer sessions by date range (for web calendar)
 */
export async function getTimerSessionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TimerSession[]> {
  try {
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching timer sessions by date range:", err);
    return [];
  }
}

/**
 * Get timer sessions for a specific date (for web daily view)
 */
export async function getTimerSessionsByDate(
  userId: string,
  date: string
): Promise<TimerSession[]> {
  try {
    // Query by log_date field instead of timestamp ranges
    // This ensures proper timezone handling
    const { data, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", date)
      .order("start_time", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error fetching timer sessions by date:", err);
    return [];
  }
}
