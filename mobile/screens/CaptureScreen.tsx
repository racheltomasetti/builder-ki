import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Animated,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { useThemeColors } from "../theme/colors";
import { KIMandala } from "../components/KIMandala";
import { useMandalaSettings } from "../hooks/useMandalaSettings";
import type { CaptureScreenProps } from "../types/navigation";
import CycleIndicator from "../components/CycleIndicator";
import CycleModal from "../components/CycleModal";
import { getCurrentCycleInfo, type CycleInfo } from "../lib/cycleApi";

// BACKFILL MODE - Set to true to enable date input for historical data entry
const BACKFILL_MODE = false;

export default function CaptureScreen({ navigation }: CaptureScreenProps) {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [backfillDate, setBackfillDate] = useState("");

  // Load saved mandala settings
  const { settings, loadSettings } = useMandalaSettings();

  // Reload settings when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadSettings();
    }
  }, [isFocused]);

  // Animation values
  const bobbingAnim = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  // Timer ref for recording duration
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user on mount and setup audio mode
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);

      // Rotate logo 180 degrees to the right when user signs in
      if (user) {
        Animated.timing(logoRotation, {
          toValue: 180,
          duration: 1111,
          useNativeDriver: true,
        }).start();

        // Load cycle info
        loadCycleInfo(user.id);
      }
    });

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

  // Hide/show navigation bars when recording + add cycle indicator to header
  useEffect(() => {
    navigation.setOptions({
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
  }, [recording, navigation, colors, cycleInfo]);

  // Bobbing animation for idle state
  useEffect(() => {
    if (!recording && !uploading) {
      const bobbing = Animated.loop(
        Animated.sequence([
          Animated.timing(bobbingAnim, {
            toValue: -10,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bobbingAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      bobbing.start();
      return () => bobbing.stop();
    }
  }, [recording, uploading, bobbingAnim]);

  const handleSignOut = async () => {
    // Rotate logo 180 degrees to the left (back to 0) on sign out
    Animated.timing(logoRotation, {
      toValue: 0,
      duration: 1111,
      useNativeDriver: true,
    }).start(async () => {
      // Sign out after animation completes
      await supabase.auth.signOut();
    });
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // === VOICE RECORDING ===
  const startRecording = async () => {
    try {
      console.log("Starting recording...");

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

  const stopRecording = async () => {
    if (!recording) return;

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
        console.log("Uploading voice recording...");
        await uploadVoiceCapture(uri);
      }

      setRecording(null);
      setRecordingDuration(0);
    } catch (err: any) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Failed to stop recording: " + err.message);
      setRecording(null);
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

  // === UPLOAD LOGIC (Voice Only) ===
  const uploadVoiceCapture = async (uri: string) => {
    try {
      console.log("Starting voice upload:", uri);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      console.log("User authenticated:", user.id);

      // Read file info
      console.log("Reading file info...");
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error("File not found");
      console.log("File exists, size:", fileInfo.size);

      // Determine file extension (default to m4a for iOS recordings)
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

      console.log("Uploading to bucket:", bucketName, "as:", fileName);

      // Read file as base64 and convert to Uint8Array
      console.log("Reading file as base64...");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array for upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log("Uploading file...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, bytes, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      console.log("Upload successful:", uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      console.log("Public URL:", publicUrl);

      // Get date for capture - use backfill date if valid, otherwise today
      let captureDate: string;

      if (BACKFILL_MODE && backfillDate) {
        // Validate backfill date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(backfillDate)) {
          captureDate = backfillDate;
          console.log("Using backfill date:", captureDate);
        } else {
          console.warn("Invalid backfill date format, using today");
          const today = new Date();
          captureDate = `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        }
      } else {
        // Normal mode or no backfill date - use today
        const today = new Date();
        captureDate = `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      }

      console.log("Capture date:", captureDate);

      // Ensure daily_log exists for the capture date
      await supabase.from("daily_logs").upsert(
        {
          user_id: user.id,
          date: captureDate,
        },
        { onConflict: "user_id,date", ignoreDuplicates: true }
      );

      // Create capture record with log_date and note_type='daily'
      console.log("Creating capture record...");

      // For backfill mode, set created_at to match the log_date (at noon UTC to avoid timezone issues)
      const captureRecord: any = {
        user_id: user.id,
        type: "voice",
        file_url: publicUrl,
        processing_status: "pending",
        note_type: "daily",
        log_date: captureDate,
      };

      // If in backfill mode with a valid date, set created_at to that date
      if (BACKFILL_MODE && backfillDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(backfillDate)) {
          // Set created_at to the backfill date at 12:00 PM (noon) to avoid timezone edge cases
          captureRecord.created_at = `${backfillDate}T12:00:00Z`;
          console.log("Setting created_at to:", captureRecord.created_at);
        }
      }

      const { error: insertError } = await supabase
        .from("captures")
        .insert(captureRecord);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("Capture record created successfully");
      Alert.alert(
        "Success!",
        "Voice note captured! Processing will begin shortly."
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Upload Error", err.message);
      throw err;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.accent2} />
            <Text style={[styles.uploadingText, { color: colors.tx2 }]}>
              Uploading voice note...
            </Text>
          </View>
        )}

        {!uploading && (
          <View style={styles.mainContent}>
            {/* Backfill Date Input - only show when BACKFILL_MODE is enabled and not recording */}
            {BACKFILL_MODE && !recording && (
              <View style={styles.backfillContainer} pointerEvents="box-none">
                <Text style={[styles.backfillLabel, { color: colors.tx2 }]}>
                  Backfill Date (YYYY-MM-DD):
                </Text>
                <TextInput
                  style={[
                    styles.backfillInput,
                    {
                      color: colors.tx,
                      backgroundColor: colors.ui2,
                      borderColor: colors.ui3,
                    },
                  ]}
                  value={backfillDate}
                  onChangeText={setBackfillDate}
                  placeholder="e.g., 2023-06-15"
                  placeholderTextColor={colors.tx3}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={true}
                  selectTextOnFocus={true}
                  returnKeyType="done"
                />
              </View>
            )}

            {/* KI Mandala - animated logo mandala */}
            <Animated.View
              style={{
                transform: [{ translateY: recording ? 0 : bobbingAnim }],
              }}
            >
              <KIMandala
                isRecording={!!recording}
                color={settings.layerColors[0]}
                centerLogoColor={colors.tx}
                centerSize={300}
                onPress={recording ? stopRecording : startRecording}
                settings={settings}
              />
            </Animated.View>
          </View>
        )}

        {/* Recording duration - fixed at bottom, only show when recording */}
        {recording && (
          <View style={styles.durationContainer}>
            <Text style={[styles.durationText, { color: colors.tx }]}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}
      </View>

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
  content: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  subtitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 48,
    textAlign: "center",
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backfillContainer: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 10,
  },
  backfillLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  backfillInput: {
    width: "100%",
    maxWidth: 280,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    zIndex: 11,
  },
  durationContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  durationText: {
    fontSize: 32,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
