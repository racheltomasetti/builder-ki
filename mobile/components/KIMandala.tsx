import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, TouchableOpacity } from "react-native";
import { KILogo } from "./Logo";

interface KIMandalaProps {
  isRecording: boolean;
  color: string;
  centerSize?: number;
  onPress: () => void;
}

export const KIMandala: React.FC<KIMandalaProps> = ({
  isRecording,
  color,
  centerSize = 200,
  onPress,
}) => {
  // Create 11 rotation animations (one for each layer)
  const rotations = useRef(
    Array.from({ length: 11 }, () => new Animated.Value(0))
  ).current;

  const centerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Start all layer rotations with alternating directions
      const animations = rotations.map((rotation, index) => {
        const isClockwise = index % 2 === 0;
        const speed = 15000 + index * 1000; // Slower as layers go outward

        return Animated.loop(
          Animated.timing(rotation, {
            toValue: isClockwise ? 1 : -1,
            duration: speed,
            useNativeDriver: true,
          })
        );
      });

      // Shrink center circle to a dot (11px when centerSize is 200)
      const centerAnimation = Animated.timing(centerScale, {
        toValue: 0.055, // Shrinks to 5.5% of original size (11px dot)
        duration: 300,
        useNativeDriver: true,
      });

      animations.forEach((anim) => anim.start());
      centerAnimation.start();

      return () => {
        animations.forEach((anim) => anim.stop());
      };
    } else {
      // Reset center circle to full size
      Animated.timing(centerScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Reset all rotations
      rotations.forEach((rotation) => rotation.setValue(0));
    }
  }, [isRecording, rotations, centerScale]);

  // Calculate positions and sizes for each layer
  // First ring starts at 40px from center, spacing increases to fill 300px radius (600px diameter)
  const layers = Array.from({ length: 11 }, (_, index) => {
    const layerIndex = index + 1;
    const radius = 11 + layerIndex * 36; // Start at 11px, increment by 26px (fills to ~326px radius)
    const logoCount = 11 + layerIndex * 2; // More logos per layer as we go out
    const logoSize = 50 + layerIndex * 4.5; // Logos get larger (24.5px → 69.5px, with 11th at ~65px)
    const rotation = rotations[index];

    return {
      radius,
      logoCount,
      logoSize,
      rotation,
      opacity: 0.15 + layerIndex * 0.05, // Fade in as layers go out
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      {/* Mandala layers - only show when recording */}
      {isRecording &&
        layers.map((layer, layerIndex) => (
          <Animated.View
            key={layerIndex}
            style={[
              styles.layer,
              {
                transform: [
                  {
                    rotate: layer.rotation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ["-360deg", "360deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            {Array.from({ length: layer.logoCount }, (_, logoIndex) => {
              const angle = (logoIndex / layer.logoCount) * 2 * Math.PI;
              const x = Math.cos(angle) * layer.radius;
              const y = Math.sin(angle) * layer.radius;

              return (
                <View
                  key={logoIndex}
                  style={[
                    styles.logoWrapper,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        // Rotate logo to point outward from center
                        { rotate: `${(angle * 180) / Math.PI + 90}deg` },
                      ],
                      opacity: layer.opacity,
                    },
                  ]}
                >
                  <KILogo
                    size={layer.logoSize}
                    color={color}
                    strokeWidth={1.5}
                    dotSize={2}
                  />
                </View>
              );
            })}
          </Animated.View>
        ))}

      {/* Center circle */}
      <Animated.View
        style={[
          styles.centerCircle,
          {
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            backgroundColor: color,
            transform: [{ scale: centerScale }],
            shadowColor: color,
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 600,
    height: 600,
    justifyContent: "center",
    alignItems: "center",
  },
  layer: {
    position: "absolute",
    width: 600,
    height: 600,
    justifyContent: "center",
    alignItems: "center",
  },
  logoWrapper: {
    position: "absolute",
  },
  centerCircle: {
    position: "absolute",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
