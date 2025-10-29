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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useThemeColors } from "../theme/colors";
import type { DailyLogScreenProps } from "../types/navigation";

type NoteType = "intention" | "reflection";

interface TodayStatus {
  hasIntention: boolean;
  hasReflection: boolean;
  captureCount: number;
  intentionTime?: string;
  reflectionTime?: string;
}

export default function DailyLogScreen({ navigation }: DailyLogScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [currentNoteType, setCurrentNoteType] = useState<NoteType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    hasIntention: false,
    hasReflection: false,
    captureCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
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
      }
      setLoading(false);
    };

    initialize();

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
    };
  }, []);

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
      const dailyNotes = captures?.filter((c) => c.note_type === "daily") || [];

      setTodayStatus({
        hasIntention: !!intention,
        hasReflection: !!reflection,
        captureCount: dailyNotes.length,
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

      const message =
        noteType === "intention"
          ? "Intention set! Have a great day."
          : "Reflection captured! Rest well.";

      Alert.alert("Success!", message);

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
      <View
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
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
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.accent2} />
            <Text style={[styles.uploadingText, { color: colors.tx2 }]}>
              Uploading...
            </Text>
          </View>
        ) : recording ? (
          // Recording UI
          <View style={styles.recordingContainer}>
            <Text style={[styles.recordingTitle, { color: colors.tx }]}>
              {currentNoteType === "intention"
                ? "Setting Intention..."
                : "Adding Reflection..."}
            </Text>

            <TouchableOpacity
              onPress={stopRecording}
              style={[
                styles.recordButton,
                { backgroundColor: colors.accent2 },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="stop" size={48} color={colors.bg} />
            </TouchableOpacity>

            <Text style={[styles.durationText, { color: colors.accent2 }]}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        ) : (
          // Daily Log UI
          <>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <Text style={[styles.dateText, { color: colors.tx }]}>
                {formatTodayDate()}
              </Text>
            </View>

            {/* Intention Section */}
            <View
              style={[styles.section, { backgroundColor: colors.ui }]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="sunny-outline"
                  size={24}
                  color={colors.accent}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.tx }]}
                >
                  Morning Intention
                </Text>
              </View>

              {todayStatus.hasIntention ? (
                <View style={styles.completedContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent}
                  />
                  <Text
                    style={[styles.completedText, { color: colors.tx2 }]}
                  >
                    Set at {todayStatus.intentionTime}
                  </Text>
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
                  <Text
                    style={[styles.actionButtonText, { color: colors.bg }]}
                  >
                    Set Today's Intention
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Daily Captures Count */}
            <View
              style={[styles.section, { backgroundColor: colors.ui }]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="recording-outline"
                  size={24}
                  color={colors.accent2}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.tx }]}
                >
                  Daily Captures
                </Text>
              </View>

              <View style={styles.captureCountContainer}>
                <Text
                  style={[
                    styles.captureCountNumber,
                    { color: colors.accent2 },
                  ]}
                >
                  {todayStatus.captureCount}
                </Text>
                <Text style={[styles.captureCountLabel, { color: colors.tx2 }]}>
                  thoughts captured
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("Capture")}
                style={[
                  styles.secondaryButton,
                  { borderColor: colors.accent2 },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.accent2 }]}
                >
                  Capture Thought
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reflection Section */}
            <View
              style={[styles.section, { backgroundColor: colors.ui }]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="moon-outline"
                  size={24}
                  color={colors.accent}
                />
                <Text
                  style={[styles.sectionTitle, { color: colors.tx }]}
                >
                  Evening Reflection
                </Text>
              </View>

              {todayStatus.hasReflection ? (
                <View style={styles.completedContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.accent}
                  />
                  <Text
                    style={[styles.completedText, { color: colors.tx2 }]}
                  >
                    Reflected at {todayStatus.reflectionTime}
                  </Text>
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
                  <Text
                    style={[styles.actionButtonText, { color: colors.bg }]}
                  >
                    Add Reflection
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  secondaryButton: {
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
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
  captureCountContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  captureCountNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  captureCountLabel: {
    fontSize: 14,
    marginTop: 4,
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
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  durationText: {
    fontSize: 32,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
