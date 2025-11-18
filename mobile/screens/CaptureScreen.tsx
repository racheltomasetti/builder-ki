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
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { Audio, Video, ResizeMode } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { useThemeColors } from "../theme/colors";
import { KIMandala } from "../components/KIMandala";
import { useMandalaSettings } from "../hooks/useMandalaSettings";
import type {
  CaptureScreenProps,
  RootStackParamList,
} from "../types/navigation";
import CycleIndicator from "../components/CycleIndicator";
import CycleModal from "../components/CycleModal";
import { getCurrentCycleInfo, type CycleInfo } from "../lib/cycleApi";
import { getActiveTimerIds } from "../lib/timerApi";
import { ThemedText } from "../components/ThemedText";
import { KILogo } from "../components/Logo";

// BACKFILL MODE - Set to true to enable date input for historical data entry
const BACKFILL_MODE = false;

interface MediaItem {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  original_date: string | null;
  created_at: string;
}

export default function CaptureScreen({ navigation }: CaptureScreenProps) {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
  const [backfillDate, setBackfillDate] = useState("");
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);

  // Load saved mandala settings
  const { settings, loadSettings, resetToDefaults } = useMandalaSettings();

  // TEMPORARY: Clear old settings to load new defaults
  // Remove this after running once
  // useEffect(() => {
  //   resetToDefaults();
  // }, []);

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
    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // Rotate logo 180 degrees to the right when user signs in
      if (user) {
        Animated.timing(logoRotation, {
          toValue: 180,
          duration: 1111,
          useNativeDriver: true,
        }).start();

        // Load cycle info and recent media
        await loadCycleInfo(user.id);
        await loadRecentMedia();
      }
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
      headerRight: !recording
        ? () => (
            <TouchableOpacity
              onPress={() => rootNavigation.navigate("Settings")}
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
  }, [recording, navigation, rootNavigation, colors, cycleInfo]);

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

      // Get the URI before stopping
      const uri = recording.getURI();

      // Stop the recording and reset audio mode
      await recording.stopAndUnloadAsync();

      // Reset audio mode after recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Clear recording state immediately for responsive UI
      setRecording(null);
      setRecordingDuration(0);

      // Show uploading state
      setUploading(true);

      // Upload in background (doesn't block UI)
      if (uri) {
        console.log("Uploading voice recording...");
        uploadVoiceCapture(uri)
          .then(() => {
            setUploading(false);
          })
          .catch((err) => {
            console.error("Upload error:", err);
            setUploading(false);
            Alert.alert("Upload Error", err.message);
          });
      } else {
        setUploading(false);
      }
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

      // Get active timers to link to this capture
      const activeTimerIds = await getActiveTimerIds(user.id);
      if (activeTimerIds.length > 0) {
        console.log("Linking capture to active timers:", activeTimerIds);
      }

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
        timer_session_ids: activeTimerIds.length > 0 ? activeTimerIds : null,
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

  // === MEDIA UPLOAD FUNCTIONS ===

  // Load 3 most recent media items
  const loadRecentMedia = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("media_items")
        .select("id, file_url, file_type, original_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      console.log("Loaded recent media:", data?.length, "items");
      setRecentMedia(data || []);
    } catch (err) {
      console.error("Error loading recent media:", err);
    }
  };

  // Delete media item
  const deleteMediaItem = async (itemId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the item to get the file URL
      const item = recentMedia.find((m) => m.id === itemId);
      if (!item) {
        throw new Error("Item not found");
      }

      // Extract file path from URL for storage deletion
      const url = new URL(item.file_url);
      const filePath = url.pathname.split("/").slice(3).join("/");

      console.log("Deleting file from storage:", filePath);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("media-items")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("media_items")
        .delete()
        .eq("id", itemId);

      if (dbError) {
        throw dbError;
      }

      // Update local state
      setRecentMedia((prev) => prev.filter((m) => m.id !== itemId));

      console.log("Media item deleted successfully");
      Alert.alert("Success", "Image deleted successfully");
    } catch (error) {
      console.error("Error deleting media item:", error);
      Alert.alert("Error", "Failed to delete image. Please try again.");
    }
  };

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take photos"
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access to select photos"
      );
      return false;
    }
    return true;
  };

  // Open camera to take photo
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia([result.assets[0]]);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Failed to take photo: " + err.message);
    }
  };

  // Open camera to record video
  const recordVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 0.7,
        videoMaxDuration: 300,
        videoQuality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia([result.assets[0]]);
      }
    } catch (err: any) {
      console.error("Video recording error:", err);
      Alert.alert("Error", "Failed to record video: " + err.message);
    }
  };

  // Open gallery to select photos and videos
  const selectMedia = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true,
        videoQuality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia(result.assets);
      }
    } catch (err: any) {
      console.error("Gallery error:", err);
      Alert.alert("Error", "Failed to select media: " + err.message);
    }
  };

  // Extract EXIF data from image
  const extractExifData = async (
    uri: string,
    exifData?: any,
    assetId?: string
  ) => {
    try {
      let originalDate: string | null = null;
      let metadata: any = {};

      // Try EXIF data first - most reliable source for original photo date
      if (exifData) {
        console.log("Trying EXIF data from picker:", Object.keys(exifData));

        // Try different date fields
        const dateString =
          exifData.DateTimeOriginal ||
          exifData.DateTimeDigitized ||
          exifData.DateTime ||
          exifData["{Exif}"]?.DateTimeOriginal ||
          exifData["{Exif}"]?.DateTimeDigitized ||
          exifData["{TIFF}"]?.DateTime;

        if (dateString) {
          try {
            // EXIF dates are in format "YYYY:MM:DD HH:MM:SS"
            // Extract only the date part (YYYY:MM:DD), not the time
            const datePart = dateString.split(' ')[0]; // "2025:11:15"
            originalDate = datePart.replace(/:/g, '-'); // "2025-11-15"
            console.log("Parsed EXIF date:", originalDate);
          } catch (parseErr) {
            console.error("Error parsing EXIF date:", parseErr);
          }
        }

        // Extract GPS location if not already set
        if (!metadata.location) {
          const gps = exifData["{GPS}"] || exifData.GPS || {};
          if (gps.Latitude && gps.Longitude) {
            metadata.location = {
              latitude: gps.Latitude,
              longitude: gps.Longitude,
            };
          }
        }

        // Extract dimensions if not already set
        if (
          !metadata.dimensions &&
          exifData.PixelXDimension &&
          exifData.PixelYDimension
        ) {
          metadata.dimensions = {
            width: exifData.PixelXDimension,
            height: exifData.PixelYDimension,
          };
        }

        // Store full EXIF for reference
        metadata.exif = exifData;
      }

      // Try MediaLibrary for additional metadata (location, dimensions) if assetId available
      // But don't use it for date - EXIF is more reliable
      if (assetId && (!metadata.location || !metadata.dimensions)) {
        try {
          console.log("Fetching MediaLibrary asset info for metadata:", assetId);
          const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);

          if (assetInfo) {
            // Extract location if not already from EXIF
            if (!metadata.location && assetInfo.location) {
              metadata.location = {
                latitude: assetInfo.location.latitude,
                longitude: assetInfo.location.longitude,
              };
            }

            // Extract dimensions if not already from EXIF
            if (!metadata.dimensions && assetInfo.width && assetInfo.height) {
              metadata.dimensions = {
                width: assetInfo.width,
                height: assetInfo.height,
              };
            }
          }
        } catch (mediaLibErr) {
          console.log("Could not fetch from MediaLibrary:", mediaLibErr);
        }
      }

      // Fallback: Use file modification date if no date found
      if (!originalDate) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.modificationTime) {
          const date = new Date(fileInfo.modificationTime * 1000);
          originalDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          console.log(
            "Using file modification date as fallback:",
            originalDate
          );
        }
      }

      return { originalDate, metadata };
    } catch (err) {
      console.error("EXIF extraction error:", err);
      // Return fallback date on error
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        let fallbackDate = null;
        if (fileInfo.exists && fileInfo.modificationTime) {
          const date = new Date(fileInfo.modificationTime * 1000);
          fallbackDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return { originalDate: fallbackDate, metadata: {} };
      } catch {
        return { originalDate: null, metadata: {} };
      }
    }
  };

  // Check if daily_log exists for a given date
  const checkDailyLogExists = async (date: string): Promise<boolean> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();

      return !error && !!data;
    } catch (err) {
      console.error("Error checking daily log:", err);
      return false;
    }
  };

  // Convert HEIC/HEIF to JPEG using ImageManipulator
  const convertHeicToJpeg = async (uri: string): Promise<string> => {
    try {
      console.log("Converting HEIC to JPEG:", uri);

      const result = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      console.log("HEIC conversion successful:", result.uri);
      return result.uri;
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error);
      throw new Error("Failed to convert HEIC image to JPEG");
    }
  };

  // Extract video metadata (duration, dimensions, file size)
  const extractVideoMetadata = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      let metadata: any = {
        fileSize: fileInfo.exists ? fileInfo.size : null,
      };

      // Fallback: Use file modification date
      let originalDate: string | null = null;
      if (fileInfo.exists && fileInfo.modificationTime) {
        const date = new Date(fileInfo.modificationTime * 1000);
        originalDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }

      return { originalDate, metadata };
    } catch (err) {
      console.error("Video metadata extraction error:", err);
      return { originalDate: null, metadata: {} };
    }
  };

  // Upload single image or video to storage and create media_items record
  const uploadSingleMedia = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate asset
      if (!asset || !asset.uri) {
        throw new Error("Invalid asset: missing URI");
      }

      console.log("Processing asset:", asset.uri);
      console.log("Asset type:", asset.type);
      console.log("Asset has exif:", !!asset.exif);
      console.log("Asset has assetId:", !!asset.assetId);

      // Determine if this is an image or video
      const isVideo = asset.type === "video";
      let processedUri = asset.uri;
      let isHeic = false;
      let originalDate: string | null = null;
      let metadata: any = {};
      let finalExt: string;
      let contentType: string;
      let fileType: "image" | "video";

      if (isVideo) {
        // Handle video
        console.log("Processing video...");
        fileType = "video";

        // Extract video metadata
        const videoData = await extractVideoMetadata(asset.uri);
        originalDate = videoData.originalDate;
        metadata = videoData.metadata;

        // Add video-specific metadata from asset
        if (asset.duration) {
          metadata.duration = asset.duration / 1000;
        }
        if (asset.width && asset.height) {
          metadata.dimensions = {
            width: asset.width,
            height: asset.height,
          };
        }

        // Determine video file extension
        const uri = asset.uri.toLowerCase();
        if (uri.includes(".mp4")) {
          finalExt = "mp4";
          contentType = "video/mp4";
        } else if (uri.includes(".mov")) {
          finalExt = "mov";
          contentType = "video/quicktime";
        } else if (uri.includes(".m4v")) {
          finalExt = "m4v";
          contentType = "video/x-m4v";
        } else {
          finalExt = "mp4";
          contentType = "video/mp4";
        }

        console.log("Video metadata:", {
          duration: metadata.duration,
          dimensions: metadata.dimensions,
          fileSize: metadata.fileSize,
        });
      } else {
        // Handle image
        console.log("Processing image...");
        fileType = "image";

        const uri = asset.uri.toLowerCase();

        // Check if it's a HEIC/HEIF file and convert to JPEG
        if (uri.includes(".heic") || uri.includes(".heif")) {
          console.log("Detected HEIC/HEIF file, converting to JPEG...");
          processedUri = await convertHeicToJpeg(asset.uri);
          isHeic = true;
        }

        // Extract EXIF data from the processed URI
        const exifData = await extractExifData(
          processedUri,
          asset.exif,
          asset.assetId ?? undefined
        );
        originalDate = exifData.originalDate;
        metadata = exifData.metadata;

        console.log("Final extracted data:", {
          originalDate,
          hasLocation: !!metadata.location,
          wasConverted: isHeic,
        });

        // Determine file extension
        finalExt = isHeic
          ? "jpg"
          : uri.includes(".jpg") || uri.includes(".jpeg")
          ? "jpg"
          : uri.includes(".png")
          ? "png"
          : "jpg";
        contentType = `image/${finalExt === "jpg" ? "jpeg" : finalExt}`;
      }

      const fileName = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${finalExt}`;
      const bucketName = "media-items";

      // Read file as base64 and convert to Uint8Array
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
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

      // Check if daily_log exists for original_date
      let logDate: string | null = null;
      if (originalDate) {
        const hasLog = await checkDailyLogExists(originalDate);
        if (hasLog) {
          logDate = originalDate;
          console.log(`Auto-linked to daily_log for ${originalDate}`);
        }
      }

      // Create media_items record
      const { error: insertError } = await supabase.from("media_items").insert({
        user_id: user.id,
        file_url: publicUrl,
        file_type: fileType,
        original_date: originalDate,
        log_date: logDate,
        metadata: metadata,
      });

      if (insertError) throw insertError;

      console.log(`${fileType} uploaded successfully:`, fileName);
      if (isHeic) {
        console.log("✅ HEIC file converted to JPEG and uploaded");
      }
      if (isVideo) {
        console.log("✅ Video uploaded successfully");
      }
    } catch (err: any) {
      console.error("Upload single media error:", err);
      throw err;
    }
  };

  // Upload media with EXIF/metadata extraction
  const uploadMedia = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);

    try {
      console.log("Uploading", assets.length, "asset(s)...");

      // Upload each asset sequentially
      let successCount = 0;
      let failCount = 0;

      for (const asset of assets) {
        try {
          await uploadSingleMedia(asset);
          successCount++;
        } catch (err) {
          console.error("Failed to upload asset:", err);
          failCount++;
        }
      }

      // Show result
      if (failCount === 0) {
        Alert.alert(
          "Success!",
          `${successCount} item(s) uploaded successfully!`
        );
      } else if (successCount === 0) {
        Alert.alert("Error", "Failed to upload all items");
      } else {
        Alert.alert(
          "Partial Success",
          `${successCount} item(s) uploaded, ${failCount} failed`
        );
      }

      // Reload recent media
      await loadRecentMedia();
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload media: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={colors.accent2} />
            <ThemedText style={[styles.uploadingText, { color: colors.tx2 }]}>
              Uploading...
            </ThemedText>
          </View>
        )}

        {!uploading && (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Backfill Date Input - only show when BACKFILL_MODE is enabled and not recording */}
            {BACKFILL_MODE && !recording && (
              <View style={styles.backfillContainer} pointerEvents="box-none">
                <ThemedText
                  style={[styles.backfillLabel, { color: colors.tx2 }]}
                >
                  Backfill Date (YYYY-MM-DD):
                </ThemedText>
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

            {/* Voice Capture Card - only show when not recording */}
            {!recording && (
              <View style={styles.voiceCaptureSection}>
                <View
                  style={[styles.uploadCard, { backgroundColor: colors.ui2 }]}
                >
                  {/* Header */}
                  <View
                    style={[styles.uploadHeader, styles.voiceCaptureHeader]}
                  >
                    <Ionicons name="mic-outline" size={24} color={colors.tx} />
                    <ThemedText
                      style={[styles.uploadHeaderText, { color: colors.tx }]}
                    >
                      Capture Voice
                    </ThemedText>
                  </View>

                  {/* KI Mandala - animated logo mandala for voice capture */}
                  <View style={styles.mandalaContainer}>
                    <Animated.View
                      style={{
                        transform: [
                          { translateY: recording ? 0 : bobbingAnim },
                        ],
                      }}
                    >
                      <KIMandala
                        isRecording={!!recording}
                        color={settings.layerColors[0]}
                        centerLogoColor={colors.tx}
                        centerSize={120}
                        onPress={recording ? stopRecording : startRecording}
                        settings={settings}
                      />
                    </Animated.View>
                  </View>
                </View>
              </View>
            )}

            {/* Media Upload Card - only show when not recording */}
            {!recording && (
              <View style={styles.mediaUploadSection}>
                <View
                  style={[styles.uploadCard, { backgroundColor: colors.ui2 }]}
                >
                  {/* Header */}
                  <View style={styles.uploadHeader}>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={colors.tx}
                    />
                    <ThemedText
                      style={[styles.uploadHeaderText, { color: colors.tx }]}
                    >
                      Upload Media
                    </ThemedText>
                  </View>

                  {/* Upload Actions */}
                  <View style={styles.uploadActionsContainer}>
                    {/* Photo and Video buttons side by side */}
                    <View style={styles.rowButtons}>
                      <TouchableOpacity
                        onPress={takePhoto}
                        style={[
                          styles.halfButton,
                          { backgroundColor: colors.accent },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="camera" size={24} color={colors.bg} />
                        <ThemedText
                          style={[styles.halfButtonText, { color: colors.bg }]}
                        >
                          Photo
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={recordVideo}
                        style={[
                          styles.halfButton,
                          { backgroundColor: colors.accent2 },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="videocam" size={24} color={colors.bg} />
                        <ThemedText
                          style={[styles.halfButtonText, { color: colors.bg }]}
                        >
                          Video
                        </ThemedText>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={selectMedia}
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.tx },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images" size={24} color={colors.bg} />
                      <ThemedText
                        style={[styles.actionButtonText, { color: colors.bg }]}
                      >
                        Choose from Library
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Recently Uploaded Media */}
                {recentMedia.length > 0 && (
                  <View style={styles.recentSection}>
                    <ThemedText
                      style={[styles.recentTitle, { color: colors.tx }]}
                    >
                      Recently Uploaded
                    </ThemedText>
                    <View style={styles.recentGrid}>
                      {recentMedia.map((item) => (
                        <View key={item.id} style={styles.recentItem}>
                          {item.file_type === "video" ? (
                            <View style={styles.videoThumbnailContainer}>
                              <Video
                                source={{ uri: item.file_url }}
                                style={[
                                  styles.recentImage,
                                  { backgroundColor: colors.ui2 },
                                ]}
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isLooping={false}
                                useNativeControls={false}
                                onError={(error) => {
                                  console.error("Video load error:", error);
                                }}
                              />
                              <View style={styles.playIconOverlay}>
                                <Ionicons
                                  name="play-circle"
                                  size={36}
                                  color="white"
                                />
                              </View>
                            </View>
                          ) : (
                            <Image
                              source={{ uri: item.file_url }}
                              style={[
                                styles.recentImage,
                                { backgroundColor: colors.ui2 },
                              ]}
                              resizeMode="cover"
                              onError={(e) => {
                                console.error(
                                  "Image load error for:",
                                  item.file_url,
                                  e.nativeEvent.error
                                );
                              }}
                            />
                          )}
                          <TouchableOpacity
                            style={[
                              styles.deleteButton,
                              { backgroundColor: "#ef4444" },
                            ]}
                            onPress={() => {
                              Alert.alert(
                                `Delete ${
                                  item.file_type === "video" ? "Video" : "Image"
                                }`,
                                `Are you sure you want to delete this ${
                                  item.file_type === "video" ? "video" : "image"
                                }? This action cannot be undone.`,
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => deleteMediaItem(item.id),
                                  },
                                ]
                              );
                            }}
                          >
                            <Ionicons name="trash" size={16} color="white" />
                          </TouchableOpacity>
                          {item.original_date && (
                            <ThemedText
                              style={[styles.recentDate, { color: colors.tx2 }]}
                            >
                              {new Date(item.original_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </ThemedText>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* KIMandala for stopping recording - shown when recording */}
        {recording && (
          <View style={styles.recordingContainer}>
            <KIMandala
              isRecording={true}
              color={settings.layerColors[0]}
              centerLogoColor={colors.tx}
              centerSize={300}
              onPress={stopRecording}
              settings={settings}
            />
          </View>
        )}

        {/* Recording duration - fixed at bottom, only show when recording */}
        {recording && (
          <View style={styles.durationContainer}>
            <ThemedText style={[styles.durationText, { color: colors.tx }]}>
              {formatDuration(recordingDuration)}
            </ThemedText>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  recordingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  voiceCaptureSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  voiceCaptureHeader: {
    marginBottom: 12,
  },
  mandalaContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    height: 140,
  },
  mediaUploadSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  uploadCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  uploadHeaderText: {
    fontSize: 20,
    fontWeight: "600",
  },
  uploadActionsContainer: {
    gap: 12,
    width: "100%",
  },
  rowButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  halfButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  halfButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  recentSection: {
    marginTop: 24,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  recentGrid: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  recentItem: {
    alignItems: "center",
    flex: 0,
    position: "relative",
  },
  recentImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
  },
  videoThumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  recentDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
