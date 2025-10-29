import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, StyleSheet, Animated } from "react-native";

interface CycleIndicatorProps {
  cycleDay: number | null;
  cyclePhase: string | null;
  onPress: () => void;
}

const CYCLE_COLORS = {
  menstrual: "#205EA6", // Blue - inner winter & reflection
  follicular: "#66800B", // Green - inner spring & growth
  ovulation: "#AD8301", // Yellow - inner summer & energy
  luteal: "#BC5215", // Orange - inner autumn & focus
  unknown: "#95A5A6", // Gray
};

export default function CycleIndicator({
  cycleDay,
  cyclePhase,
  onPress,
}: CycleIndicatorProps) {
  const bobbingAnim = useRef(new Animated.Value(0)).current;

  // Bobbing animation
  useEffect(() => {
    const bobbing = Animated.loop(
      Animated.sequence([
        Animated.timing(bobbingAnim, {
          toValue: -4,
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

  // Determine color based on phase
  const getPhaseColor = (): string => {
    if (!cyclePhase) return CYCLE_COLORS.unknown;
    return (
      CYCLE_COLORS[cyclePhase as keyof typeof CYCLE_COLORS] ||
      CYCLE_COLORS.unknown
    );
  };

  // Display text (cycle day or "?")
  const displayText = cycleDay !== null ? cycleDay.toString() : "?";

  const phaseColor = getPhaseColor();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: phaseColor,
            transform: [{ translateY: bobbingAnim }],
          },
        ]}
      >
        <Text style={styles.text}>{displayText}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    opacity: 0.75,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
