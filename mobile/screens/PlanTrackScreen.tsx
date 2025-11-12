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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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

type NoteType = "intention" | "reflection";
type ViewMode = "plan" | "track";

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

export default function PlanTrackScreen({
  navigation: tabNavigation,
}: PlanTrackScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [viewMode, setViewMode] = useState<ViewMode>("plan");
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
  const [reflectionTriggered, setReflectionTriggered] = useState(false);
  const [isAfter6PM, setIsAfter6PM] = useState(false);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current time is past 6 PM (18:00)
  const checkIsAfter6PM = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 18; // 6 PM or later
  };

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

    // Check if after 6pm initially
    setIsAfter6PM(checkIsAfter6PM());

    // Check every minute if after 6pm
    const timeCheckInterval = setInterval(() => {
      setIsAfter6PM(checkIsAfter6PM());
    }, 60000); // Check every 60 seconds

    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
      clearInterval(timeCheckInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
      // Tab bar label always shows "Plan | Track"
      tabBarLabel: "Plan | Track",
    });
  }, [recording, tabNavigation, navigation, colors, cycleInfo, viewMode]);

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

  // Handle reflection trigger (from Track view)
  const handleReflectionTrigger = () => {
    setReflectionTriggered(true);
    setViewMode("plan");
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

      setTasks(tasksData || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
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

  // Start timer for a task
  const startTimer = async (task: DailyTask) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

      // Add to active timers
      setActiveTimers([
        ...activeTimers,
        {
          id: timerSession.id,
          taskId: task.id,
          taskName: task.task_description,
          startTime: new Date(),
          elapsedSeconds: 0,
        },
      ]);

      console.log("Timer started for task:", task.task_description);
    } catch (err: any) {
      console.error("Error starting timer:", err);
      Alert.alert("Error", "Failed to start timer: " + err.message);
    }
  };

  // Stop timer
  const stopTimer = async (timer: ActiveTimer) => {
    try {
      // Use API to stop timer
      await apiStopTimer(timer.id, timer.taskId);

      // Update local state
      setTasks(
        tasks.map((t) =>
          t.id === timer.taskId ? { ...t, status: "completed" } : t
        )
      );

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
        intention: "Intention set! Have a great day.",
        reflection: "Reflection captured! Rest well.",
      };

      Alert.alert("Success!", messages[noteType]);

      // Reset reflection trigger after reflection is recorded
      if (noteType === "reflection") {
        setReflectionTriggered(false);
      }

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
      {/* Toggle Switch */}
      {!recording && !uploading && (
        <View style={[styles.toggleContainer, { backgroundColor: colors.ui }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "plan" && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => setViewMode("plan")}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color: viewMode === "plan" ? colors.bg : colors.tx2,
                },
              ]}
            >
              Plan
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "track" && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => setViewMode("track")}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.toggleText,
                {
                  color: viewMode === "track" ? colors.bg : colors.tx2,
                },
              ]}
            >
              Track
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
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
        ) : viewMode === "plan" ? (
          // PLAN VIEW
          <>
            {/* Date Header */}
            {/* <View style={styles.dateHeader}>
              <ThemedText style={[styles.dateText, { color: colors.tx }]}>
                {formatTodayDate()}
              </ThemedText>
            </View> */}

            {/* Set Intention Button */}
            <View style={[styles.section, { backgroundColor: colors.ui }]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color={colors.accent}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.tx }]}>
                  Set Intention
                </ThemedText>
              </View>

              {todayStatus.hasIntention ? (
                <View style={styles.completedContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent}
                  />
                  <ThemedText
                    style={[styles.completedText, { color: colors.tx2 }]}
                  >
                    Set at {todayStatus.intentionTime}
                  </ThemedText>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => startRecording("intention")}
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.accent },
                  ]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mic" size={24} color={colors.bg} />
                  <ThemedText
                    style={[styles.actionButtonText, { color: colors.bg }]}
                  >
                    Set Today's Intention
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Plan Your Day - Task Input */}
            <View style={[styles.section, { backgroundColor: colors.ui }]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="list-outline"
                  size={24}
                  color={colors.accent2}
                />
                <ThemedText style={[styles.sectionTitle, { color: colors.tx }]}>
                  Plan Your Day
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
                <View style={styles.taskList}>
                  {tasks.map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.taskItem,
                        { backgroundColor: colors.bg, borderColor: colors.ui3 },
                      ]}
                    >
                      <View style={styles.taskContent}>
                        <Ionicons
                          name={
                            task.status === "completed"
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={20}
                          color={
                            task.status === "completed"
                              ? colors.accent2
                              : colors.tx3
                          }
                        />
                        <ThemedText
                          style={[
                            styles.taskText,
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
                      <TouchableOpacity
                        onPress={() => deleteTask(task.id)}
                        style={styles.deleteTaskButton}
                      >
                        <Ionicons name="close" size={20} color={colors.tx3} />
                      </TouchableOpacity>
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

            {/* Daily Reflection Button - Only show if triggered from Track view */}
            {reflectionTriggered && (
              <View style={[styles.section, { backgroundColor: colors.ui }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="moon-outline"
                    size={24}
                    color={colors.accent}
                  />
                  <ThemedText
                    style={[styles.sectionTitle, { color: colors.tx }]}
                  >
                    Daily Reflection
                  </ThemedText>
                </View>

                {todayStatus.hasReflection ? (
                  <View style={styles.completedContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.accent}
                    />
                    <ThemedText
                      style={[styles.completedText, { color: colors.tx2 }]}
                    >
                      Reflected at {todayStatus.reflectionTime}
                    </ThemedText>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => startRecording("reflection")}
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.accent },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={24} color={colors.bg} />
                    <ThemedText
                      style={[styles.actionButtonText, { color: colors.bg }]}
                    >
                      Add Reflection
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        ) : (
          // TRACK VIEW
          <View style={styles.trackViewContainer}>
            {/* Active Timer Bar */}
            {activeTimers.length > 0 && (
              <View
                style={[styles.activeTimerBar, { backgroundColor: colors.ui }]}
              >
                <View style={styles.activeTimerHeader}>
                  <Ionicons
                    name="timer-outline"
                    size={20}
                    color={colors.accent2}
                  />
                  <ThemedText
                    style={[styles.activeTimerTitle, { color: colors.tx }]}
                  >
                    Active Timers
                  </ThemedText>
                </View>
                <View style={styles.activeTimerList}>
                  {activeTimers.map((timer) => (
                    <View
                      key={timer.id}
                      style={[
                        styles.activeTimerItem,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.accent2,
                        },
                      ]}
                    >
                      <View style={styles.activeTimerContent}>
                        <ThemedText
                          style={[styles.activeTimerName, { color: colors.tx }]}
                          numberOfLines={1}
                        >
                          {timer.taskName}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.activeTimerTime,
                            { color: colors.accent2 },
                          ]}
                        >
                          {formatDuration(timer.elapsedSeconds)}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => stopTimer(timer)}
                        style={[
                          styles.stopTimerButton,
                          { backgroundColor: colors.accent },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="stop" size={16} color={colors.bg} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Today's Tasks */}
            {tasks.length > 0 ? (
              <View style={[styles.section, { backgroundColor: colors.ui }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={24}
                    color={colors.accent2}
                  />
                  <ThemedText
                    style={[styles.sectionTitle, { color: colors.tx }]}
                  >
                    Today's Tasks
                  </ThemedText>
                </View>

                <View style={styles.trackTaskList}>
                  {tasks.map((task) => (
                    <View
                      key={task.id}
                      style={[
                        styles.trackTaskItem,
                        { backgroundColor: colors.bg, borderColor: colors.ui3 },
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
                          <Ionicons name="play" size={16} color={colors.bg} />
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
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="list-outline" size={64} color={colors.tx3} />
                <ThemedText
                  style={[styles.placeholderText, { color: colors.tx2 }]}
                >
                  No tasks yet
                </ThemedText>
                <ThemedText
                  style={[styles.placeholderSubtext, { color: colors.tx3 }]}
                >
                  Add tasks in the Plan tab to start tracking
                </ThemedText>
              </View>
            )}

            {/* Reflection Trigger Button - Only show after 6pm and if no reflection yet */}
            {isAfter6PM && !todayStatus.hasReflection && (
              <View
                style={[
                  styles.reflectionTriggerSection,
                  { backgroundColor: colors.ui },
                ]}
              >
                <View style={styles.reflectionTriggerContent}>
                  <Ionicons
                    name="moon-outline"
                    size={28}
                    color={colors.accent}
                  />
                  <View style={styles.reflectionTriggerTextContainer}>
                    <ThemedText
                      style={[
                        styles.reflectionTriggerTitle,
                        { color: colors.tx },
                      ]}
                    >
                      Ready to reflect on your day?
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.reflectionTriggerSubtext,
                        { color: colors.tx3 },
                      ]}
                    >
                      Take a moment to capture your thoughts
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleReflectionTrigger}
                  style={[
                    styles.reflectionTriggerButton,
                    { backgroundColor: colors.accent },
                  ]}
                  activeOpacity={0.8}
                >
                  <ThemedText
                    style={[
                      styles.reflectionTriggerButtonText,
                      { color: colors.bg },
                    ]}
                  >
                    Begin Reflection
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={20} color={colors.bg} />
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  toggleContainer: {
    flexDirection: "row",
    margin: 16,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
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
  trackViewContainer: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    gap: 12,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 16,
    textAlign: "center",
  },
  reflectionTriggerSection: {
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    gap: 16,
  },
  reflectionTriggerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  reflectionTriggerTextContainer: {
    flex: 1,
    gap: 4,
  },
  reflectionTriggerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  reflectionTriggerSubtext: {
    fontSize: 14,
  },
  reflectionTriggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  reflectionTriggerButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  deleteTaskButton: {
    padding: 4,
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
  activeTimerBar: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeTimerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  activeTimerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  activeTimerList: {
    gap: 12,
  },
  activeTimerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  activeTimerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activeTimerName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  activeTimerTime: {
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    minWidth: 60,
    textAlign: "right",
  },
  stopTimerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  stopTimerText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
