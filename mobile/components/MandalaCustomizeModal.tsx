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
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/colors";
import {
  MandalaSettings,
  MANDALA_CONSTRAINTS,
} from "../constants/mandalaDefaults";
import { COLOR_PALETTE, ColorPaletteItem } from "../constants/colorPalette";

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

  // Track which layer color is being edited (0 = Layer 1, 1 = Layer 2)
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<0 | 1>(0);

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

  const handleColorSelect = (colorItem: ColorPaletteItem) => {
    // Update the selected layer color
    const newLayerColors: [string, string] = [...settings.layerColors] as [string, string];
    newLayerColors[selectedLayerIndex] = colorItem.hex;
    onSettingsChange({
      layerColors: newLayerColors,
    });
  };

  const getCurrentColor = () => {
    return settings.layerColors[selectedLayerIndex];
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
                CUSTOMIZE YOUR K·I
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
                  thumbColor={isPreviewMode ? "#af3029" : colors.ui3}
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
                  <View style={styles.colorSection}>
                    {/* Layer Toggle - Select which layer to customize */}
                    <View style={styles.layerToggleContainer}>
                      <TouchableOpacity
                        onPress={() => setSelectedLayerIndex(0)}
                        style={[
                          styles.layerToggleButton,
                          {
                            backgroundColor: selectedLayerIndex === 0
                              ? settings.layerColors[0]
                              : colors.ui2
                          },
                          selectedLayerIndex === 0 && styles.layerToggleButtonActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.layerToggleText,
                            { color: selectedLayerIndex === 0 ? "#fff" : colors.tx },
                          ]}
                        >
                          Layer 1
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setSelectedLayerIndex(1)}
                        style={[
                          styles.layerToggleButton,
                          {
                            backgroundColor: selectedLayerIndex === 1
                              ? settings.layerColors[1]
                              : colors.ui2
                          },
                          selectedLayerIndex === 1 && styles.layerToggleButtonActive,
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.layerToggleText,
                            { color: selectedLayerIndex === 1 ? "#fff" : colors.tx },
                          ]}
                        >
                          Layer 2
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Color Grid - for layer colors only (center is theme-based) */}
                    <View style={styles.colorGrid}>
                      {COLOR_PALETTE.map((colorItem) => (
                        <TouchableOpacity
                          key={colorItem.id}
                          onPress={() => handleColorSelect(colorItem)}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: colorItem.hex },
                            getCurrentColor() === colorItem.hex && [
                              styles.colorSwatchSelected,
                              { borderColor: colors.tx },
                            ],
                          ]}
                        >
                          {getCurrentColor() === colorItem.hex && (
                            <MaterialIcons
                              name="check"
                              size={20}
                              color="#fff"
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
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
                  { backgroundColor: "#af3029" },
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
  colorSection: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
  },
  layerToggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  layerToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Android shadow
    elevation: 2,
  },
  layerToggleButtonActive: {
    borderWidth: 3,
    borderColor: "#fff",
    // Stronger shadow when active
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  layerToggleText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  colorToggleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  colorToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  colorToggleButtonActive: {
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 3,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 6,
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
