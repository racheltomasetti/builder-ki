import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useThemeColors } from "../theme/colors";
import type {
  PlanTrackScreenProps,
  RootStackParamList,
} from "../types/navigation";
import { KIMandala } from "../components/KIMandala";
import { KILogo } from "../components/Logo";
import CycleIndicator from "../components/CycleIndicator";
import CycleModal from "../components/CycleModal";
import { getCurrentCycleInfo, type CycleInfo } from "../lib/cycleApi";
import {
  getActiveTimers,
  startTimer as apiStartTimer,
  stopTimer as apiStopTimer,
  type ActiveTimer,
} from "../lib/timerApi";
import { ThemedText } from "../components/ThemedText";
import SegmentedControl from "../components/SegmentedControl";
import TimelineView from "../components/TimelineView";

type NoteType = "intention" | "reflection";

interface TodayStatus {
  hasIntention: boolean;
  hasReflection: boolean;
  intentionTime?: string;
  reflectionTime?: string;
}

interface DailyTask {
  id: string;
  task_description: string;
  scheduled_time: string | null;
  estimated_duration: number | null;
  status: "pending" | "in_progress" | "completed";
  timer_session_id: string | null;
  task_date: string;
}

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

export default function PlanTrackScreen({
  navigation: tabNavigation,
}: PlanTrackScreenProps) {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [currentNoteType, setCurrentNoteType] = useState<NoteType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    hasIntention: false,
    hasReflection: false,
  });
  const [loading, setLoading] = useState(true);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(0); // 0 = Plan, 1 = Review
  const [timelineData, setTimelineData] = useState<{
    intention?: Capture;
    timeline: TimelineItem[];
    reflection?: Capture;
  }>({
    timeline: [],
  });

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get user and load today's status
  useEffect(() => {
    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadTodayStatus();
        await loadCycleInfo(user.id);
        await loadTodayTasks();
        await loadActiveTimers();
        await loadTimelineData();
      }
      setLoading(false);
    };

    initialize();

    // Start timer update interval (updates elapsed time every second)
    timerIntervalRef.current = setInterval(() => {
      setActiveTimers((prevTimers) =>
        prevTimers.map((timer) => ({
          ...timer,
          elapsedSeconds: Math.floor(
            (new Date().getTime() - timer.startTime.getTime()) / 1000
          ),
        }))
      );
    }, 1000);

    // Initialize audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Reload tasks and active timers when screen comes into focus
  useEffect(() => {
    if (isFocused && user) {
      console.log("Screen focused, reloading tasks...");
      loadTodayTasks();
      loadActiveTimers();
      loadTodayStatus();
      loadTimelineData();
    }
  }, [isFocused, user]);

  // Subscribe to real-time updates for tasks
  useEffect(() => {
    if (!user) return;

    const today = getTodayDate();

    console.log("Setting up real-time subscription for user:", user.id);

    // Subscribe to changes in daily_tasks table
    const tasksSubscription = supabase
      .channel("daily_tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_tasks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Task change detected:", payload);
          // Reload tasks whenever there's a change
          loadTodayTasks();
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from task changes");
      tasksSubscription.unsubscribe();
    };
  }, [user]);

  // Hide/show navigation bars when recording + add cycle indicator to header
  useEffect(() => {
    tabNavigation.setOptions({
      headerShown: !recording,
      headerLeft: !recording
        ? () => (
            <View style={{ marginLeft: 12 }}>
              <CycleIndicator
                cycleDay={cycleInfo?.cycleDay || null}
                cyclePhase={cycleInfo?.cyclePhase || null}
                onPress={() => setCycleModalVisible(true)}
              />
            </View>
          )
        : undefined,
      headerRight: !recording
        ? () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Settings")}
              style={{ marginRight: 12 }}
              activeOpacity={0.7}
            >
              <KILogo size={55} color={colors.tx} />
            </TouchableOpacity>
          )
        : undefined,
      tabBarStyle: recording
        ? { display: "none" }
        : {
            backgroundColor: colors.bg,
            borderTopColor: colors.ui3,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 20,
            paddingTop: 4,
          },
    });
  }, [recording, tabNavigation, navigation, colors, cycleInfo]);

  // Load today's status from database
  const loadTodayStatus = async () => {
    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Query captures for today
      const { data: captures, error } = await supabase
        .from("captures")
        .select("note_type, created_at")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const intention = captures?.find((c) => c.note_type === "intention");
      const reflection = captures?.find((c) => c.note_type === "reflection");

      setTodayStatus({
        hasIntention: !!intention,
        hasReflection: !!reflection,
        intentionTime: intention
          ? new Date(intention.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
        reflectionTime: reflection
          ? new Date(reflection.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
      });
    } catch (err) {
      console.error("Error loading today status:", err);
    }
  };

  // Load cycle info from database
  const loadCycleInfo = async (userId: string) => {
    try {
      const info = await getCurrentCycleInfo(userId);
      setCycleInfo(info);
    } catch (err) {
      console.error("Error loading cycle info:", err);
    }
  };

  // Handle cycle update (called after modal actions)
  const handleCycleUpdate = async () => {
    if (user) {
      await loadCycleInfo(user.id);
    }
  };

  // Load today's tasks from database
  const loadTodayTasks = async () => {
    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tasksData, error } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_date", today)
        .order("created_at", { ascending: true });

      if (error) throw error;

      console.log("Loaded tasks:", tasksData);
      setTasks(tasksData || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  // Refresh data (pull to refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTodayStatus(),
      loadTodayTasks(),
      loadActiveTimers(),
      loadTimelineData(),
    ]);
    setRefreshing(false);
  };

  // Add new task
  const addTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("daily_tasks")
        .insert({
          user_id: user.id,
          task_description: newTaskText.trim(),
          task_date: today,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setTasks([...tasks, data]);
      setNewTaskText("");
    } catch (err: any) {
      console.error("Error adding task:", err);
      Alert.alert("Error", "Failed to add task: " + err.message);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("daily_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      // Remove from local state
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      console.error("Error deleting task:", err);
      Alert.alert("Error", "Failed to delete task: " + err.message);
    }
  };

  // Load active timers from database
  const loadActiveTimers = async () => {
    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const timers = await getActiveTimers(user.id, today);
      setActiveTimers(timers);
    } catch (err) {
      console.error("Error loading active timers:", err);
    }
  };

  // Load timeline data for review view
  const loadTimelineData = async () => {
    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch captures for today
      const { data: captures, error: capturesError } = await supabase
        .from("captures")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .order("created_at", { ascending: true });

      if (capturesError) throw capturesError;

      // Fetch media for today
      const { data: media, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .or(`original_date.eq.${today},log_date.eq.${today}`)
        .order("created_at", { ascending: true });

      if (mediaError) throw mediaError;

      // Fetch timer sessions for today
      const { data: timerSessions, error: timersError } = await supabase
        .from("timer_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
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

      setTimelineData({
        intention,
        timeline,
        reflection,
      });
    } catch (err) {
      console.error("Error loading timeline data:", err);
    }
  };

  // Start timer for a task
  const startTimer = async (task: DailyTask) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if there's already an active timer
      if (activeTimers.length > 0) {
        Alert.alert(
          "Timer Already Active",
          "You already have an active timer. Please stop it before starting a new one.",
          [{ text: "OK" }]
        );
        return;
      }

      // Use API to create timer session
      const timerSession = await apiStartTimer(
        user.id,
        task.task_description,
        task.id
      );

      if (!timerSession) throw new Error("Failed to create timer session");

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: "in_progress", timer_session_id: timerSession.id }
            : t
        )
      );

      // Set single active timer
      const newTimer = {
        id: timerSession.id,
        taskId: task.id,
        taskName: task.task_description,
        startTime: new Date(),
        elapsedSeconds: 0,
      };
      setActiveTimers([newTimer]);

      console.log("Timer started for task:", task.task_description);

      // Navigate to Capture screen in Focus Mode
      tabNavigation.navigate("Capture", {
        focusMode: true,
        timerId: timerSession.id,
        taskId: task.id,
        taskName: task.task_description,
      });
    } catch (err: any) {
      console.error("Error starting timer:", err);
      Alert.alert("Error", "Failed to start timer: " + err.message);
    }
  };

  // Stop timer
  const stopTimer = async (timer: ActiveTimer) => {
    try {
      // Use API to stop timer (only pass taskId if it exists)
      await apiStopTimer(timer.id, timer.taskId || undefined);

      // Update local state only if task is linked and exists in today's tasks
      if (timer.taskId) {
        setTasks(
          tasks.map((t) =>
            t.id === timer.taskId ? { ...t, status: "completed" } : t
          )
        );
      }

      // Remove from active timers
      setActiveTimers(activeTimers.filter((t) => t.id !== timer.id));

      console.log("Timer stopped for task:", timer.taskName);
    } catch (err: any) {
      console.error("Error stopping timer:", err);
      Alert.alert("Error", "Failed to stop timer: " + err.message);
    }
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format today's date nicely
  const formatTodayDate = (): string => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Ensure daily_log record exists for today
  const ensureDailyLogExists = async () => {
    try {
      const today = getTodayDate();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert daily_log if doesn't exist (ON CONFLICT DO NOTHING)
      await supabase.from("daily_logs").upsert(
        {
          user_id: user.id,
          date: today,
        },
        { onConflict: "user_id,date", ignoreDuplicates: true }
      );
    } catch (err) {
      console.error("Error ensuring daily log exists:", err);
    }
  };

  // Start recording
  const startRecording = async (noteType: NoteType) => {
    try {
      console.log(`Starting ${noteType} recording...`);

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow microphone access");
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setCurrentNoteType(noteType);

      // Start duration timer
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      console.log("Recording started");
    } catch (err: any) {
      console.error("Start recording error:", err);
      Alert.alert("Error", "Failed to start recording: " + err.message);
      // Reset audio mode on error
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (!recording || !currentNoteType) return;

    try {
      console.log("Stopping recording...");

      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      setUploading(true);
      await recording.stopAndUnloadAsync();

      // Reset audio mode after recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const uri = recording.getURI();

      if (uri) {
        console.log(`Uploading ${currentNoteType} recording...`);
        await uploadVoiceCapture(uri, currentNoteType);
      }

      setRecording(null);
      setCurrentNoteType(null);
      setRecordingDuration(0);
    } catch (err: any) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Failed to stop recording: " + err.message);
      setRecording(null);
      setCurrentNoteType(null);
      setRecordingDuration(0);

      // Stop timer on error too
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Reset audio mode on error too
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } finally {
      setUploading(false);
    }
  };

  // Upload voice capture with note_type and log_date
  const uploadVoiceCapture = async (uri: string, noteType: NoteType) => {
    try {
      console.log("Starting voice upload:", uri);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Ensure daily_log exists
      await ensureDailyLogExists();

      // Read file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error("File not found");

      // Determine file extension
      const ext = uri.endsWith(".m4a")
        ? "m4a"
        : uri.endsWith(".mp3")
        ? "mp3"
        : uri.endsWith(".wav")
        ? "wav"
        : "m4a";
      const contentType = "audio/" + ext;

      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const bucketName = "voice-notes";

      // Read file as base64 and convert to Uint8Array
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, bytes, {
          contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      // Create capture record with note_type and log_date
      const today = getTodayDate();
      const { error: insertError } = await supabase.from("captures").insert({
        user_id: user.id,
        type: "voice",
        file_url: publicUrl,
        processing_status: "pending",
        note_type: noteType,
        log_date: today,
      });

      if (insertError) throw insertError;

      console.log("Capture record created successfully");

      // Success messages based on note type
      const messages = {
        intention: "Intention set! ",
        reflection: "Reflection captured! ",
      };

      Alert.alert("Success!", messages[noteType]);

      // Reload today's status
      await loadTodayStatus();
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Upload Error", err.message);
      throw err;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent2}
            colors={[colors.accent2]}
          />
        }
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.accent2} />
            <ThemedText style={[styles.uploadingText, { color: colors.tx2 }]}>
              Uploading...
            </ThemedText>
          </View>
        ) : recording ? (
          // Recording UI with Rainbow Mandala
          <View style={styles.recordingContainer}>
            <ThemedText style={[styles.recordingTitle, { color: colors.tx }]}>
              {currentNoteType === "intention"
                ? "Setting Intention..."
                : "Adding Reflection..."}
            </ThemedText>

            <View style={styles.mandalaWrapper}>
              <KIMandala
                isRecording={true}
                color={colors.accent}
                centerSize={120}
                onPress={stopRecording}
                rainbowMode={true}
              />
            </View>

            <ThemedText
              style={[styles.durationText, { color: colors.accent2 }]}
            >
              {formatDuration(recordingDuration)}
            </ThemedText>
          </View>
        ) : (
          // MAIN VIEW
          <>
            {/* Segmented Control */}
            <View style={styles.segmentedControlContainer}>
              <SegmentedControl
                segments={["Plan", "Track"]}
                selectedIndex={viewMode}
                onSegmentChange={setViewMode}
                activeColor={colors.accent}
                inactiveColor={colors.tx3}
                textColor={colors.bg}
                backgroundColor={colors.ui}
              />
            </View>

            {viewMode === 0 ? (
              // PLAN MODE
              <>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <ThemedText style={[styles.dateText, { color: colors.tx }]}>
                    {formatTodayDate()}
                  </ThemedText>
                </View>

                {/* Set Intention Button */}
                <View style={[styles.section, { backgroundColor: colors.ui }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sunny-outline" size={24} color="#D4AF37" />
                    <ThemedText
                      style={[styles.sectionTitle, { color: colors.tx }]}
                    >
                      Live with Intention
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    onPress={() => startRecording("intention")}
                    style={[styles.actionButton, styles.intentionButton]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={24} color="#1a1a1a" />
                    <ThemedText
                      style={[styles.actionButtonText, { color: "#1a1a1a" }]}
                    >
                      Set Intention
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Plan Your Day - Task Input */}
                <View style={[styles.section, { backgroundColor: colors.ui }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="list-outline"
                      size={24}
                      color={colors.accent2}
                    />
                    <ThemedText
                      style={[styles.sectionTitle, { color: colors.tx }]}
                    >
                      Today's Flow
                    </ThemedText>
                  </View>

                  {/* Task Input */}
                  <View style={styles.taskInputContainer}>
                    <TextInput
                      style={[
                        styles.taskInput,
                        {
                          backgroundColor: colors.bg,
                          color: colors.tx,
                          borderColor: colors.ui3,
                        },
                      ]}
                      placeholder="add task..."
                      placeholderTextColor={colors.tx3}
                      value={newTaskText}
                      onChangeText={setNewTaskText}
                      onSubmitEditing={addTask}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      onPress={addTask}
                      style={[
                        styles.addTaskButton,
                        { backgroundColor: colors.accent2 },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={24} color={colors.bg} />
                    </TouchableOpacity>
                  </View>

                  {/* Task List */}
                  {tasks.length > 0 && (
                    <View style={styles.trackTaskList}>
                      {tasks.map((task) => (
                        <View
                          key={task.id}
                          style={[
                            styles.trackTaskItem,
                            {
                              backgroundColor: colors.bg,
                              borderColor: colors.ui3,
                            },
                          ]}
                        >
                          <View style={styles.trackTaskContent}>
                            <Ionicons
                              name={
                                task.status === "completed"
                                  ? "checkmark-circle"
                                  : task.status === "in_progress"
                                  ? "radio-button-on"
                                  : "ellipse-outline"
                              }
                              size={24}
                              color={
                                task.status === "completed"
                                  ? colors.accent
                                  : task.status === "in_progress"
                                  ? colors.accent2
                                  : colors.tx3
                              }
                            />
                            <ThemedText
                              style={[
                                styles.trackTaskText,
                                {
                                  color: colors.tx,
                                  textDecorationLine:
                                    task.status === "completed"
                                      ? "line-through"
                                      : "none",
                                },
                              ]}
                            >
                              {task.task_description}
                            </ThemedText>
                          </View>

                          {/* Start button for pending tasks */}
                          {task.status === "pending" && (
                            <TouchableOpacity
                              onPress={() => startTimer(task)}
                              style={[
                                styles.startTaskButton,
                                { backgroundColor: colors.accent2 },
                              ]}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name="play"
                                size={16}
                                color={colors.bg}
                              />
                              <ThemedText
                                style={[
                                  styles.startTaskButtonText,
                                  { color: colors.bg },
                                ]}
                              >
                                Start
                              </ThemedText>
                            </TouchableOpacity>
                          )}

                          {/* Status indicator for in-progress/completed tasks */}
                          {task.status === "in_progress" && (
                            <View style={styles.taskStatusBadge}>
                              <ThemedText
                                style={[
                                  styles.taskStatusText,
                                  { color: colors.accent2 },
                                ]}
                              >
                                In Progress
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {tasks.length === 0 && (
                    <View style={styles.emptyTasksContainer}>
                      <ThemedText
                        style={[styles.emptyTasksText, { color: colors.tx3 }]}
                      >
                        No tasks yet. Add your first task above!
                      </ThemedText>
                    </View>
                  )}
                </View>

                {/* Daily Reflection Button - Always available */}
                <View style={[styles.section, { backgroundColor: colors.ui }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="moon-outline" size={24} color="#7C3AED" />
                    <ThemedText
                      style={[styles.sectionTitle, { color: colors.tx }]}
                    >
                      Reflect
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    onPress={() => startRecording("reflection")}
                    style={[styles.actionButton, styles.reflectionButton]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={24} color="#ffffff" />
                    <ThemedText
                      style={[styles.actionButtonText, { color: "#ffffff" }]}
                    >
                      Add Reflection
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              // REVIEW MODE
              <>
                {/* Date Header */}
                <View style={styles.dateHeader}>
                  <ThemedText style={[styles.dateText, { color: colors.tx }]}>
                    {formatTodayDate()}
                  </ThemedText>
                </View>

                {/* Timeline View */}
                <TimelineView
                  intention={timelineData.intention}
                  timeline={timelineData.timeline}
                  reflection={timelineData.reflection}
                  isDark={isDark}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Cycle Modal */}
      {user && (
        <CycleModal
          visible={cycleModalVisible}
          onClose={() => setCycleModalVisible(false)}
          userId={user.id}
          onCycleUpdate={handleCycleUpdate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  segmentedControlContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  dateText: {
    fontSize: 20,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  intentionButton: {
    backgroundColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  reflectionButton: {
    backgroundColor: "#5e409d",
    shadowColor: "#7C3AED",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "500",
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "500",
  },
  recordingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 40,
  },
  mandalaWrapper: {
    width: 600,
    height: 600,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  durationText: {
    fontSize: 32,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  taskInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  taskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Perpetua",
  },
  addTaskButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTasksContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyTasksText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  trackTaskList: {
    gap: 12,
  },
  trackTaskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trackTaskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trackTaskText: {
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },
  startTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startTaskButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
