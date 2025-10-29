import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { supabase } from "../lib/supabase";
import { useThemeColors } from "../theme/colors";
import type { MediaUploadScreenProps } from "../types/navigation";
import CycleIndicator from "../components/CycleIndicator";
import CycleModal from "../components/CycleModal";
import { getCurrentCycleInfo, type CycleInfo } from "../lib/cycleApi";

interface MediaItem {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  original_date: string | null;
  created_at: string;
}

export default function MediaUploadScreen({
  navigation,
}: MediaUploadScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [recentMedia, setRecentMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);

  // Get user and load recent media
  useEffect(() => {
    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadRecentMedia();
        await loadCycleInfo(user.id);
      }
      setLoading(false);
    };

    initialize();
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

  // Set cycle indicator in header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{ marginLeft: 12 }}>
          <CycleIndicator
            cycleDay={cycleInfo?.cycleDay || null}
            cyclePhase={cycleInfo?.cyclePhase || null}
            onPress={() => setCycleModalVisible(true)}
          />
        </View>
      ),
    });
  }, [navigation, cycleInfo]);

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
      const filePath = url.pathname.split("/").slice(3).join("/"); // Remove /storage/v1/object/public/bucket-name/

      console.log("Deleting file from storage:", filePath);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("media-items")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue with database deletion even if storage fails
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
        exif: true, // Request EXIF data
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia([result.assets[0]]);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Failed to take photo: " + err.message);
    }
  };

  // Open gallery to select photos
  const selectPhotos = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: true, // Request EXIF data
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadMedia(result.assets);
      }
    } catch (err: any) {
      console.error("Gallery error:", err);
      Alert.alert("Error", "Failed to select photos: " + err.message);
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

      // Try to get richer data from MediaLibrary if we have assetId
      if (assetId) {
        try {
          console.log("Fetching MediaLibrary asset info for:", assetId);
          const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);

          if (assetInfo) {
            console.log("Got asset info from MediaLibrary:", {
              creationTime: assetInfo.creationTime,
              modificationTime: assetInfo.modificationTime,
              hasLocation: !!assetInfo.location,
            });

            // Use creation time from MediaLibrary
            if (assetInfo.creationTime) {
              originalDate = new Date(assetInfo.creationTime)
                .toISOString()
                .split("T")[0];
              console.log("Using MediaLibrary creation date:", originalDate);
            }

            // Extract location
            if (assetInfo.location) {
              metadata.location = {
                latitude: assetInfo.location.latitude,
                longitude: assetInfo.location.longitude,
              };
            }

            // Extract dimensions
            if (assetInfo.width && assetInfo.height) {
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

      // If still no date, try EXIF data from ImagePicker
      if (!originalDate && exifData) {
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
            const normalized = dateString.replace(
              /^(\d{4}):(\d{2}):(\d{2})/,
              "$1-$2-$3"
            );
            const date = new Date(normalized);
            if (!isNaN(date.getTime())) {
              originalDate = date.toISOString().split("T")[0];
              console.log("Parsed EXIF date:", originalDate);
            }
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

      // Fallback: Use file modification date if no date found
      if (!originalDate) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.modificationTime) {
          originalDate = new Date(fileInfo.modificationTime * 1000)
            .toISOString()
            .split("T")[0];
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
        const fallbackDate =
          fileInfo.exists && fileInfo.modificationTime
            ? new Date(fileInfo.modificationTime * 1000)
                .toISOString()
                .split("T")[0]
            : null;
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

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transformations needed, just format conversion
        {
          compress: 0.85, // Good quality with smaller file size
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log("HEIC conversion successful:", result.uri);
      return result.uri;
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error);
      throw new Error("Failed to convert HEIC image to JPEG");
    }
  };

  // Upload single image to storage and create media_items record
  const uploadSingleImage = async (asset: ImagePicker.ImagePickerAsset) => {
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
      console.log("Asset has exif:", !!asset.exif);
      console.log("Asset has assetId:", !!asset.assetId);

      // Check if it's a HEIC/HEIF file and convert to JPEG
      let processedUri = asset.uri;
      let isHeic = false;

      const uri = asset.uri.toLowerCase();
      if (uri.includes(".heic") || uri.includes(".heif")) {
        console.log("Detected HEIC/HEIF file, converting to JPEG...");
        processedUri = await convertHeicToJpeg(asset.uri);
        isHeic = true;
      }

      // Extract EXIF data from the processed URI (pass both EXIF and assetId if available)
      const { originalDate, metadata } = await extractExifData(
        processedUri,
        asset.exif,
        asset.assetId ?? undefined
      );
      console.log("Final extracted data:", {
        originalDate,
        hasLocation: !!metadata.location,
        wasConverted: isHeic,
      });

      // Determine file extension - always use jpg for converted files
      const finalExt = isHeic
        ? "jpg"
        : uri.includes(".jpg") || uri.includes(".jpeg")
        ? "jpg"
        : uri.includes(".png")
        ? "png"
        : "jpg";
      const contentType = `image/${finalExt === "jpg" ? "jpeg" : finalExt}`;

      const fileName = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${finalExt}`;
      const bucketName = "media-items";

      // Read file as base64 and convert to Uint8Array (use processed URI)
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
        file_type: "image",
        original_date: originalDate,
        log_date: logDate,
        metadata: metadata,
      });

      if (insertError) throw insertError;

      console.log("Media item uploaded successfully:", fileName);
      if (isHeic) {
        console.log("✅ HEIC file converted to JPEG and uploaded");
      }
    } catch (err: any) {
      console.error("Upload single image error:", err);
      throw err;
    }
  };

  // Upload media with EXIF extraction
  const uploadMedia = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);

    try {
      console.log("Uploading", assets.length, "asset(s)...");

      // Upload each asset sequentially
      let successCount = 0;
      let failCount = 0;

      for (const asset of assets) {
        try {
          await uploadSingleImage(asset);
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
          `${successCount} photo(s) uploaded successfully!`
        );
      } else if (successCount === 0) {
        Alert.alert("Error", "Failed to upload all photos");
      } else {
        Alert.alert(
          "Partial Success",
          `${successCount} photo(s) uploaded, ${failCount} failed`
        );
      }

      // Reload recent media
      await loadRecentMedia();
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload photos: " + err.message);
    } finally {
      setUploading(false);
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
      {/* Main Content - centered */}
      <View style={styles.mainContent}>
        <View style={[styles.uploadCard, { backgroundColor: colors.ui }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.tx }]}>
              Upload Media
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.tx2 }]}>
              Add photos from your journey
            </Text>
          </View>

          {/* Upload Actions */}
          {!uploading && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                onPress={takePhoto}
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.accent },
                ]}
                activeOpacity={0.8}
                disabled={uploading}
              >
                <Ionicons name="camera" size={32} color={colors.bg} />
                <Text style={[styles.actionButtonText, { color: colors.bg }]}>
                  Take Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectPhotos}
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.accent2 },
                ]}
                activeOpacity={0.8}
                disabled={uploading}
              >
                <Ionicons name="images" size={32} color={colors.bg} />
                <Text style={[styles.actionButtonText, { color: colors.bg }]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Uploading Indicator */}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.uploadingText, { color: colors.tx2 }]}>
                Uploading photos...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Recently Uploaded - fixed at bottom */}
      {!uploading && recentMedia.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.recentTitle, { color: colors.tx }]}>
            Recently Uploaded
          </Text>
          <View style={styles.recentGrid}>
            {recentMedia.map((item) => (
              <View key={item.id} style={styles.recentItem}>
                <Image
                  source={{ uri: item.file_url }}
                  style={[styles.recentImage, { backgroundColor: colors.ui2 }]}
                  resizeMode="cover"
                  onError={(e) => {
                    console.error(
                      "Image load error for:",
                      item.file_url,
                      e.nativeEvent.error
                    );
                  }}
                  onLoad={() => {
                    console.log("Image loaded successfully:", item.file_url);
                  }}
                />
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: "#ef4444" }]}
                  onPress={() => {
                    Alert.alert(
                      "Delete Image",
                      "Are you sure you want to delete this image? This action cannot be undone.",
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
                  <Text style={[styles.recentDate, { color: colors.tx2 }]}>
                    {new Date(item.original_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

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
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  uploadCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  actionsContainer: {
    gap: 16,
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  uploadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  recentSection: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  recentTitle: {
    fontSize: 20,
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
  },
  recentImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
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
