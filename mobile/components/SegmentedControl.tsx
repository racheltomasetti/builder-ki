import { View, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from "react-native";
import { ThemedText } from "./ThemedText";
import { useEffect, useRef, useState } from "react";

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onSegmentChange: (index: number) => void;
  activeColor: string;
  inactiveColor: string;
  textColor: string;
  backgroundColor: string;
}

export default function SegmentedControl({
  segments,
  selectedIndex,
  onSegmentChange,
  activeColor,
  inactiveColor,
  textColor,
  backgroundColor,
}: SegmentedControlProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerWidth > 0) {
      const segmentWidth = (containerWidth - 8) / segments.length; // 8 is total padding (4px on each side)
      Animated.spring(translateX, {
        toValue: selectedIndex * segmentWidth,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    }
  }, [selectedIndex, containerWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const segmentWidth = containerWidth > 0 ? (containerWidth - 8) / segments.length : 0;

  return (
    <View style={[styles.container, { backgroundColor }]} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.activeSegment,
            {
              backgroundColor: activeColor,
              width: segmentWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          style={styles.segment}
          onPress={() => onSegmentChange(index)}
          activeOpacity={0.7}
        >
          <ThemedText
            style={[
              styles.segmentText,
              {
                color: selectedIndex === index ? textColor : inactiveColor,
                fontWeight: selectedIndex === index ? "700" : "500",
              },
            ]}
          >
            {segment}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    position: "relative",
  },
  activeSegment: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentText: {
    fontSize: 15,
    fontFamily: "Perpetua",
  },
});
