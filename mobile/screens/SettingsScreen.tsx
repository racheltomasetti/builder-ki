import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Alert,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useThemeColors } from "../theme/colors";
import { KIMandala } from "../components/KIMandala";
import { MandalaCustomizeModal } from "../components/MandalaCustomizeModal";
import { useMandalaSettings } from "../hooks/useMandalaSettings";
import type { SettingsScreenProps } from "../types/navigation";

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = useThemeColors(isDark);

  const [user, setUser] = useState<any>(null);

  // Mandala customization state
  const { settings, saveSettings, resetToDefaults } = useMandalaSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const [isCustomizeModalVisible, setIsCustomizeModalVisible] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Bobbing animation for preview mandala
  const bobbingAnim = useRef(new Animated.Value(0)).current;

  // Load user data
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Update tempSettings when settings change
  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Bobbing animation for preview mandala
  useEffect(() => {
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
  }, [bobbingAnim]);

  // Handlers
  const handleOpenCustomize = () => {
    setTempSettings(settings);
    setIsCustomizeModalVisible(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizeModalVisible(false);
  };

  const handleTempSettingsChange = (updates: Partial<typeof settings>) => {
    setTempSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleApplySettings = async () => {
    await saveSettings(tempSettings);
    setIsPreviewMode(false);
    Alert.alert("Success", "Mandala settings saved!");
  };

  const handleResetSettings = async () => {
    await resetToDefaults();
    setTempSettings(settings);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.ui3, backgroundColor: colors.bg },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={28} color={colors.tx} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.tx }]}>Settings</Text>

        <View style={styles.headerRight} />
      </View>

      {/* Preview Mode Overlay - Full Screen */}
      {isPreviewMode && (
        <View style={[styles.previewOverlay, { backgroundColor: colors.bg }]}>
          <View style={styles.previewMandalaContainer}>
            <KIMandala
              isRecording={true}
              color={tempSettings.layerColors[0]}
              centerLogoColor={colors.tx}
              centerSize={200}
              onPress={() => {}}
              settings={tempSettings}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              setIsPreviewMode(false);
              setIsCustomizeModalVisible(true); // Reopen modal when closing preview
            }}
            style={[styles.closePreviewButton, { backgroundColor: "#af3029" }]}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
            <Text style={styles.closePreviewText}>Close Preview</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Customize Modal - Hide when in preview mode */}
      {!isPreviewMode && (
        <MandalaCustomizeModal
          visible={isCustomizeModalVisible}
          onClose={handleCloseCustomize}
          isDark={isDark}
          settings={tempSettings}
          onSettingsChange={handleTempSettingsChange}
          onApply={handleApplySettings}
          onReset={handleResetSettings}
          isPreviewMode={isPreviewMode}
          onPreviewToggle={(value) => {
            setIsPreviewMode(value);
            if (value) {
              // Close modal when entering preview
              setIsCustomizeModalVisible(false);
            }
          }}
        />
      )}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.tx2 }]}>
            PROFILE
          </Text>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.card,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.profileRow}>
                <MaterialIcons name="email" size={20} color={colors.tx2} />
                <Text style={[styles.profileText, { color: colors.tx }]}>
                  {user?.email || "Loading..."}
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Mandala Customization Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.tx2 }]}>
            CUSTOMIZE YOUR K·I
          </Text>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.card,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <View style={styles.cardContent}>
              {/* Small Mandala Preview */}
              <View style={styles.mandalaPreviewContainer}>
                <Animated.View
                  style={{
                    transform: [{ translateY: bobbingAnim }],
                  }}
                >
                  <View style={styles.mandalaPreview}>
                    <KIMandala
                      isRecording={false}
                      color={settings.layerColors[0]}
                      centerLogoColor={colors.tx}
                      centerSize={400}
                      onPress={() => {}}
                      settings={settings}
                    />
                  </View>
                </Animated.View>
              </View>

              {/* Customize Button */}
              <TouchableOpacity
                onPress={handleOpenCustomize}
                style={[styles.customizeButton, { backgroundColor: "#af3029" }]}
              >
                <MaterialIcons name="palette" size={20} color="#fff" />
                <Text style={styles.customizeButtonText}>CUSTOMIZE</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.tx2 }]}>
            ACCOUNT
          </Text>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.card,
              {
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <View style={styles.cardContent}>
              <TouchableOpacity
                onPress={handleSignOut}
                style={styles.signOutButton}
              >
                <MaterialIcons name="logout" size={20} color={colors.tx} />
                <Text style={[styles.signOutText, { color: colors.tx }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerRight: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android shadow
    elevation: 4,
  },
  cardContent: {
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileText: {
    fontSize: 16,
  },
  mandalaPreviewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  mandalaPreview: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.4 }],
  },
  customizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
  },
  signOutText: {
    fontSize: 16,
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // backgroundColor set dynamically via colors.bg
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  previewMandalaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closePreviewButton: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  closePreviewText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
