import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/colors";

interface MandalaCustomizeButtonProps {
  onPress: () => void;
  isDark: boolean;
}

export const MandalaCustomizeButton: React.FC<MandalaCustomizeButtonProps> = ({
  onPress,
  isDark,
}) => {
  const colors = useThemeColors(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.blurContainer,
          {
            borderColor: "rgba(227, 83, 54, 0.5)", // Accent border per glassmorphism specs
            shadowColor: "rgba(227, 83, 54, 0.3)",
          },
        ]}
      >
        <MaterialIcons name="palette" size={24} color={colors.tx} />
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 160, // Below header
    right: 15,
    zIndex: 100,
  },
  blurContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 8,
  },
});
