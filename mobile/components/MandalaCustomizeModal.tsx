import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import ColorPicker from "react-native-wheel-color-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/colors";
import {
  MandalaSettings,
  MANDALA_CONSTRAINTS,
} from "../constants/mandalaDefaults";

interface MandalaCustomizeModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  settings: MandalaSettings;
  onSettingsChange: (updates: Partial<MandalaSettings>) => void;
  onApply: () => void;
  onReset: () => void;
  isPreviewMode: boolean;
  onPreviewToggle: (value: boolean) => void;
}

export const MandalaCustomizeModal: React.FC<MandalaCustomizeModalProps> = ({
  visible,
  onClose,
  isDark,
  settings,
  onSettingsChange,
  onApply,
  onReset,
  isPreviewMode,
  onPreviewToggle,
}) => {
  const colors = useThemeColors(isDark);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<
    "layers" | "center"
  >("layers");

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    preview: true,
    colors: false,
    spacing: false,
    logoSize: false,
    logoCount: false,
    rotationSpeed: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const openColorPicker = (target: "layers" | "center") => {
    setColorPickerTarget(target);
    setShowColorPicker(true);
  };

  const handleColorChange = (color: string) => {
    if (colorPickerTarget === "layers") {
      onSettingsChange({ color });
    } else {
      onSettingsChange({ centerCircleColor: color });
    }
  };

  const handleApplyAndClose = () => {
    onApply();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}
      >
        {/* Modal Card */}
        <TouchableOpacity activeOpacity={1} style={styles.modalWrapper}>
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.modalCard,
              {
                borderColor: "rgba(227, 83, 54, 0.3)",
                shadowColor: "rgba(227, 83, 54, 0.3)",
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.tx }]}>
                CREATE YOUR K·I
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.tx} />
              </TouchableOpacity>
            </View>

            {/* Preview Toggle - Sticky at top */}
            <View
              style={[styles.stickySection, { borderBottomColor: colors.ui3 }]}
            >
              <View style={styles.row}>
                <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                  K·I PREVIEW
                </Text>
                <Switch
                  value={isPreviewMode}
                  onValueChange={onPreviewToggle}
                  trackColor={{
                    false: colors.ui3,
                    true: "rgba(227, 83, 54, 0.5)",
                  }}
                  thumbColor={isPreviewMode ? "rgb(227, 83, 54)" : colors.ui3}
                />
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Color Section */}
              <View style={[styles.section, { borderBottomColor: colors.ui3 }]}>
                <TouchableOpacity
                  onPress={() => toggleSection("colors")}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                    Colors
                  </Text>
                  <MaterialIcons
                    name={
                      expandedSections.colors ? "expand-less" : "expand-more"
                    }
                    size={24}
                    color={colors.tx}
                  />
                </TouchableOpacity>

                {expandedSections.colors && (
                  <>
                    {/* Layers Color */}
                    <View style={styles.colorRow}>
                      <Text style={[styles.label, { color: colors.tx2 }]}>
                        Layer Color
                      </Text>
                      <TouchableOpacity
                        onPress={() => openColorPicker("layers")}
                        style={[
                          styles.colorPreview,
                          { backgroundColor: settings.color },
                        ]}
                      />
                    </View>

                    {/* Center Circle Color */}
                    <View style={styles.colorRow}>
                      <Text style={[styles.label, { color: colors.tx2 }]}>
                        Center Color
                      </Text>
                      <TouchableOpacity
                        onPress={() => openColorPicker("center")}
                        style={[
                          styles.colorPreview,
                          { backgroundColor: settings.centerCircleColor },
                        ]}
                      />
                    </View>

                    {/* Color Picker */}
                    {showColorPicker && (
                      <View style={styles.colorPickerContainer}>
                        <ColorPicker
                          color={
                            colorPickerTarget === "layers"
                              ? settings.color
                              : settings.centerCircleColor
                          }
                          onColorChange={handleColorChange}
                          thumbSize={30}
                          sliderSize={30}
                          noSnap={true}
                          row={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowColorPicker(false)}
                          style={[
                            styles.doneButton,
                            { backgroundColor: "rgba(227, 83, 54, 0.8)" },
                          ]}
                        >
                          <Text
                            style={[styles.doneButtonText, { color: "#fff" }]}
                          >
                            Done
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Layer Spacing */}
              <View style={[styles.section, { borderBottomColor: colors.ui3 }]}>
                <TouchableOpacity
                  onPress={() => toggleSection("spacing")}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                      Layer Spacing
                    </Text>
                    <View style={styles.sectionHeaderRight}>
                      <Text
                        style={[styles.valueText, { color: colors.accent }]}
                      >
                        {settings.radiusSpacingMultiplier.toFixed(1)}x
                      </Text>
                      <MaterialIcons
                        name={
                          expandedSections.spacing
                            ? "expand-less"
                            : "expand-more"
                        }
                        size={24}
                        color={colors.tx}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {expandedSections.spacing && (
                  <Slider
                    style={styles.slider}
                    minimumValue={
                      MANDALA_CONSTRAINTS.radiusSpacingMultiplier.min
                    }
                    maximumValue={
                      MANDALA_CONSTRAINTS.radiusSpacingMultiplier.max
                    }
                    step={MANDALA_CONSTRAINTS.radiusSpacingMultiplier.step}
                    value={settings.radiusSpacingMultiplier}
                    onValueChange={(value) =>
                      onSettingsChange({ radiusSpacingMultiplier: value })
                    }
                    minimumTrackTintColor="rgb(227, 83, 54)"
                    maximumTrackTintColor={colors.ui3}
                    thumbTintColor="rgb(227, 83, 54)"
                  />
                )}
              </View>

              {/* Logo Size */}
              <View style={[styles.section, { borderBottomColor: colors.ui3 }]}>
                <TouchableOpacity
                  onPress={() => toggleSection("logoSize")}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                      Logo Size
                    </Text>
                    <View style={styles.sectionHeaderRight}>
                      <Text
                        style={[styles.valueText, { color: colors.accent }]}
                      >
                        {settings.logoSizeMultiplier.toFixed(1)}x
                      </Text>
                      <MaterialIcons
                        name={
                          expandedSections.logoSize
                            ? "expand-less"
                            : "expand-more"
                        }
                        size={24}
                        color={colors.tx}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {expandedSections.logoSize && (
                  <Slider
                    style={styles.slider}
                    minimumValue={MANDALA_CONSTRAINTS.logoSizeMultiplier.min}
                    maximumValue={MANDALA_CONSTRAINTS.logoSizeMultiplier.max}
                    step={MANDALA_CONSTRAINTS.logoSizeMultiplier.step}
                    value={settings.logoSizeMultiplier}
                    onValueChange={(value) =>
                      onSettingsChange({ logoSizeMultiplier: value })
                    }
                    minimumTrackTintColor="rgb(227, 83, 54)"
                    maximumTrackTintColor={colors.ui3}
                    thumbTintColor="rgb(227, 83, 54)"
                  />
                )}
              </View>

              {/* Logo Count */}
              <View style={[styles.section, { borderBottomColor: colors.ui3 }]}>
                <TouchableOpacity
                  onPress={() => toggleSection("logoCount")}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                      Logo Count
                    </Text>
                    <View style={styles.sectionHeaderRight}>
                      <Text
                        style={[styles.valueText, { color: colors.accent }]}
                      >
                        {settings.logoCountMultiplier.toFixed(1)}x
                      </Text>
                      <MaterialIcons
                        name={
                          expandedSections.logoCount
                            ? "expand-less"
                            : "expand-more"
                        }
                        size={24}
                        color={colors.tx}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {expandedSections.logoCount && (
                  <Slider
                    style={styles.slider}
                    minimumValue={MANDALA_CONSTRAINTS.logoCountMultiplier.min}
                    maximumValue={MANDALA_CONSTRAINTS.logoCountMultiplier.max}
                    step={MANDALA_CONSTRAINTS.logoCountMultiplier.step}
                    value={settings.logoCountMultiplier}
                    onValueChange={(value) =>
                      onSettingsChange({ logoCountMultiplier: value })
                    }
                    minimumTrackTintColor="rgb(227, 83, 54)"
                    maximumTrackTintColor={colors.ui3}
                    thumbTintColor="rgb(227, 83, 54)"
                  />
                )}
              </View>

              {/* Rotation Speed */}
              <View style={[styles.section, { borderBottomColor: colors.ui3 }]}>
                <TouchableOpacity
                  onPress={() => toggleSection("rotationSpeed")}
                  style={styles.sectionHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.sliderHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.tx }]}>
                      Rotation Speed
                    </Text>
                    <View style={styles.sectionHeaderRight}>
                      <Text
                        style={[styles.valueText, { color: colors.accent }]}
                      >
                        {settings.rotationSpeedMultiplier.toFixed(1)}x
                      </Text>
                      <MaterialIcons
                        name={
                          expandedSections.rotationSpeed
                            ? "expand-less"
                            : "expand-more"
                        }
                        size={24}
                        color={colors.tx}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {expandedSections.rotationSpeed && (
                  <Slider
                    style={styles.slider}
                    minimumValue={
                      MANDALA_CONSTRAINTS.rotationSpeedMultiplier.min
                    }
                    maximumValue={
                      MANDALA_CONSTRAINTS.rotationSpeedMultiplier.max
                    }
                    step={MANDALA_CONSTRAINTS.rotationSpeedMultiplier.step}
                    value={settings.rotationSpeedMultiplier}
                    onValueChange={(value) =>
                      onSettingsChange({ rotationSpeedMultiplier: value })
                    }
                    minimumTrackTintColor="rgb(227, 83, 54)"
                    maximumTrackTintColor={colors.ui3}
                    thumbTintColor="rgb(227, 83, 54)"
                  />
                )}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { borderTopColor: colors.ui3 }]}>
              <TouchableOpacity
                onPress={onReset}
                style={[
                  styles.button,
                  styles.resetButton,
                  { borderColor: colors.ui3 },
                ]}
              >
                <MaterialIcons name="refresh" size={20} color={colors.tx2} />
                <Text style={[styles.buttonText, { color: colors.tx2 }]}>
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyAndClose}
                style={[
                  styles.button,
                  styles.applyButton,
                  { backgroundColor: "rgba(227, 83, 54, 0.8)" },
                ]}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalWrapper: {
    width: "100%",
    maxWidth: 400,
    height: "80%",
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: "hidden",
    flex: 1,
    // iOS shadow
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    // Android shadow
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  stickySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
    maxHeight: "100%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  label: {
    fontSize: 16,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  colorPickerContainer: {
    marginTop: 20,
    height: 300,
  },
  doneButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: {
    fontSize: 16,
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  resetButton: {
    borderWidth: 2,
  },
  applyButton: {
    // Accent color background
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
