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

      // Get today's date in YYYY-MM-DD format (local timezone)
      const today = new Date();
      const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      console.log("Today's date (local):", todayDate, "Raw date:", today.toString());

      // Ensure daily_log exists for today
      await supabase.from("daily_logs").upsert(
        {
          user_id: user.id,
          date: todayDate,
        },
        { onConflict: "user_id,date", ignoreDuplicates: true }
      );

      // Create capture record with log_date and note_type='daily'
      console.log("Creating capture record...");
      const { error: insertError } = await supabase.from("captures").insert({
        user_id: user.id,
        type: "voice",
        file_url: publicUrl,
        processing_status: "pending",
        note_type: "daily",
        log_date: todayDate,
      });

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
            {/* KI Mandala - animated logo mandala */}
            <Animated.View
              style={{
                transform: [{ translateY: recording ? 0 : bobbingAnim }],
              }}
            >
              <KIMandala
                isRecording={!!recording}
                color={settings.color}
                centerCircleColor={settings.centerCircleColor}
                centerSize={200}
                onPress={recording ? stopRecording : startRecording}
                settings={settings}
              />
            </Animated.View>
          </View>
        )}

        {/* Recording duration - fixed at bottom, only show when recording */}
        {recording && (
          <View style={styles.durationContainer}>
            <Text style={[styles.durationText, { color: colors.accent2 }]}>
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
