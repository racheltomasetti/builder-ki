import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

export default function CaptureScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Get user on mount and setup audio mode
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
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

  // Debug: Log color scheme changes
  useEffect(() => {
    console.log("Color scheme changed:", colorScheme);
    console.log("isDark:", isDark);
  }, [colorScheme, isDark]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    } catch (err: any) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Failed to stop recording: " + err.message);
      setRecording(null);
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

      // Create capture record
      console.log("Creating capture record...");
      const { error: insertError } = await supabase.from("captures").insert({
        user_id: user.id,
        type: "voice",
        file_url: publicUrl,
        processing_status: "pending",
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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>ki</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text
              style={[styles.uploadingText, isDark && styles.uploadingTextDark]}
            >
              Uploading voice note...
            </Text>
          </View>
        )}

        {!recording && !uploading && (
          <View style={styles.mainContent}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={startRecording}
              activeOpacity={0.8}
            ></TouchableOpacity>
            {/* <Text style={[styles.tapHint, isDark && styles.tapHintDark]}>
              Tap to capture
            </Text> */}
          </View>
        )}

        {recording && (
          <View style={styles.recordingContent}>
            <View
              style={[
                styles.recordingIndicator,
                isDark && styles.recordingIndicatorDark,
              ]}
            >
              <View style={styles.recordingPulse} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopRecording}
              activeOpacity={0.8}
            >
              <Text style={styles.stopIcon}>⏹️</Text>
              <Text style={styles.stopText}>Stop Recording</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  signOutText: {
    color: "#3b82f6",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
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
    color: "#6b7280",
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tapHint: {
    marginTop: 32,
    fontSize: 18,
    color: "#6b7280",
    fontWeight: "500",
  },
  recordingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingIndicator: {
    alignItems: "center",
    marginBottom: 48,
    padding: 24,
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  recordingPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#991b1b",
  },
  stopButton: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: "#ef4444",
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  stopText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  infoBox: {
    padding: 16,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  infoText: {
    color: "#1e40af",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: "#111827",
  },
  headerDark: {
    borderBottomColor: "#374151",
    backgroundColor: "#1f2937",
  },
  titleDark: {
    color: "#f9fafb",
  },
  uploadingTextDark: {
    color: "#9ca3af",
  },
  tapHintDark: {
    color: "#9ca3af",
  },
  recordingIndicatorDark: {
    backgroundColor: "#7f1d1d",
    borderColor: "#991b1b",
  },
});
