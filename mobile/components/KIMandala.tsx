import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, TouchableOpacity } from "react-native";
import { KILogo } from "./Logo";
import { MandalaSettings, DEFAULT_MANDALA_SETTINGS } from "../constants/mandalaDefaults";
import { COLOR_PALETTE } from "../constants/colorPalette";

interface KIMandalaProps {
  isRecording: boolean;
  color: string;
  centerSize?: number;
  onPress: () => void;
  settings?: MandalaSettings;
  centerCircleColor?: string;
  rainbowMode?: boolean;
}

export const KIMandala: React.FC<KIMandalaProps> = ({
  isRecording,
  color,
  centerSize = 200,
  onPress,
  settings = DEFAULT_MANDALA_SETTINGS,
  centerCircleColor,
  rainbowMode = false,
}) => {
  // Create 11 rotation animations (one for each layer)
  const rotations = useRef(
    Array.from({ length: 11 }, () => new Animated.Value(0))
  ).current;

  const centerScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Start all layer rotations with alternating directions
      const animations = rotations.map((rotation, index) => {
        const isClockwise = index % 2 === 0;
        const baseSpeed = settings.baseRotationSpeed + index * settings.rotationSpeedIncrement;
        const speed = baseSpeed / settings.rotationSpeedMultiplier; // Divide to make higher multiplier = faster

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

      // Pulse animation for the center dot
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      animations.forEach((anim) => anim.start());
      centerAnimation.start();
      pulseAnimation.start();

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

      // Reset pulse to normal size
      pulseScale.setValue(1);

      // Reset all rotations
      rotations.forEach((rotation) => rotation.setValue(0));
    }
  }, [isRecording, rotations, centerScale, pulseScale, settings]);

  // Calculate positions and sizes for each layer
  // Using dynamic settings with multipliers
  const layers = Array.from({ length: 11 }, (_, index) => {
    const layerIndex = index + 1;
    const baseLogoSize = settings.baseLogoSize + layerIndex * settings.logoSizeIncrement;
    const logoSize = baseLogoSize * settings.logoSizeMultiplier;

    const baseRadius = settings.baseRadius + layerIndex * (settings.radiusSpacing + baseLogoSize * 0.01);
    const radius = baseRadius * settings.radiusSpacingMultiplier;

    const baseLogoCount = settings.baseLogoCount + layerIndex * settings.logoCountIncrement;
    const logoCount = Math.round(baseLogoCount * settings.logoCountMultiplier);

    const rotation = rotations[index];

    // Get rainbow color for this layer if rainbow mode is enabled
    const layerColor = rainbowMode
      ? COLOR_PALETTE[index % COLOR_PALETTE.length].hex
      : color;

    return {
      radius,
      logoCount,
      logoSize,
      rotation,
      opacity: 0.15 + layerIndex * 0.05, // Fade in as layers go out
      color: layerColor,
    };
  });

  return (
    <View style={styles.container}>
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
                    color={layer.color}
                    strokeWidth={1.5}
                    dotSize={2}
                  />
                </View>
              );
            })}
          </Animated.View>
        ))}

      {/* Center circle - only this is touchable */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.centerTouchable}
      >
        <Animated.View
          style={[
            styles.centerCircle,
            {
              width: centerSize,
              height: centerSize,
              borderRadius: centerSize / 2,
              backgroundColor: centerCircleColor || color,
              transform: [{ scale: centerScale }, { scale: pulseScale }],
              shadowColor: centerCircleColor || color,
            },
          ]}
        />
      </TouchableOpacity>
    </View>
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
  centerTouchable: {
    position: "absolute",
  },
  centerCircle: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
