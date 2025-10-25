Vision Overview
The Goal: Replace the simple pulsing rings with an animated mandala made of 11 concentric layers of rotating KI logos that appear when recording starts.
Component Architecture

1. KIMandala Component (new file: components/KIMandala.tsx)
   This is a self-contained component that manages all the mandala magic.
   What it does:

Renders 11 concentric circular layers around a center point
Each layer contains multiple KI logos arranged in a circle
When isRecording is true: logos appear, layers rotate, center circle shrinks to a dot
When isRecording is false: layers disappear, center circle returns to full size

Key concepts:

11 layers - each at increasing radius from center (100px, 125px, 150px, etc.)
Alternating rotation - even layers clockwise, odd layers counter-clockwise
Scaling logos - logos get progressively LARGER as layers expand outward (20px → 53px)
Logo count per layer - inner layers have fewer logos (6), outer layers have more (26)
Logo orientation - each logo rotates to "point outward" from the center
Opacity fade - logos get slightly more opaque as layers go outward
Center circle animation - scales from 1.0 (full 200px circle) to 0.05 (tiny 10px dot)

2. CaptureScreen Updates (modify existing file)
   Replace the old glow ring system with the new mandala.
   What changes:

Remove: pulseAnim, glowAnim, old useEffects for pulsing
Remove: glow ring rendering code
Remove: the standalone mic button TouchableOpacity
Add: Import and render <KIMandala /> component
Keep: bobbingAnim for idle state bobbing
Keep: recording duration timer display

Integration:
<Animated.View with bobbing animation>
<KIMandala
isRecording={!!recording}
color={recording ? blue : lighter-blue}
centerSize={200}
onPress={recording ? stopRecording : startRecording}
/>
</Animated.View>
Animation Behavior
Idle State (not recording):

Only center blue circle visible (200px)
Gentle bobbing up/down animation
No logos visible

Recording State:

Center circle shrinks to tiny dot (10px) in 300ms
11 logo layers fade in and start rotating
Each layer rotates at different speed (inner faster, outer slower)
Alternating directions create hypnotic counter-flow
Logos arranged in perfect circles, pointing outward like petals

Math Behind the Mandala
For each layer:

Radius: 100 + layerIndex _ 25 (how far from center)
Logo count: 4 + layerIndex _ 2 (more logos in outer rings)
Logo size: 20 + layerIndex _ 3 (bigger logos outward)
Position: Polar coordinates → x = cos(angle) _ radius, y = sin(angle) \* radius
Rotation: Each logo rotated angle + 90° to point away from center

Files to Create/Modify

Create: components/KIMandala.tsx (new mandala component)
Modify: screens/CaptureScreen.tsx (integrate mandala, remove old code)
Keep: components/KILogo.tsx (already exists, no changes needed)

Key Technical Details

Uses Animated.Value for each layer's rotation (11 separate values)
Uses Animated.loop with Animated.timing for continuous rotation
Uses transform: [{ rotate }] for layer rotation
Uses transform: [{ translateX, translateY, rotate }] for logo positioning
Center circle uses transform: [{ scale }] for shrink animation
All animations use useNativeDriver: true for performance

Expected Visual Result
When you tap and hold to record, you should see:

Center blue circle rapidly shrinks to a pinpoint dot
11 concentric rings of KI logos fade in
Logos spin in mesmerizing alternating directions
Creates a kaleidoscope/mandala effect
Logos get larger as they get further from center
Release = everything reverses, center grows back, logos fade out

```
EXAMPLE // components/KIMandala.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { KILogo } from './KILogo';

interface KIMandalaProps {
  isRecording: boolean;
  color: string;
  centerSize?: number; // Size of center circle when not recording
}

export const KIMandala: React.FC<KIMandalaProps> = ({
  isRecording,
  color,
  centerSize = 200
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
        const speed = 8000 + index * 1000; // Slower as layers go outward

        return Animated.loop(
          Animated.timing(rotation, {
            toValue: isClockwise ? 1 : -1,
            duration: speed,
            useNativeDriver: true,
          })
        );
      });

      // Shrink center circle to a dot
      const centerAnimation = Animated.timing(centerScale, {
        toValue: 0.05, // Shrinks to 5% of original size (dot)
        duration: 300,
        useNativeDriver: true,
      });

      animations.forEach(anim => anim.start());
      centerAnimation.start();

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Reset center circle to full size
      Animated.timing(centerScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Reset all rotations
      rotations.forEach(rotation => rotation.setValue(0));
    }
  }, [isRecording, rotations, centerScale]);

  // Calculate positions and sizes for each layer
  const layers = Array.from({ length: 11 }, (_, index) => {
    const layerIndex = index + 1;
    const radius = 100 + layerIndex * 25; // Distance from center
    const logoCount = 4 + layerIndex * 2; // More logos per layer as we go out
    const logoSize = 20 + layerIndex * 3; // Logos get larger
    const rotation = rotations[index];

    return {
      radius,
      logoCount,
      logoSize,
      rotation,
      opacity: 0.15 + (layerIndex * 0.05), // Fade in as layers go out
    };
  });

  return (
    <View style={styles.container}>
      {/* Mandala layers - only show when recording */}
      {isRecording && layers.map((layer, layerIndex) => (
        <Animated.View
          key={layerIndex}
          style={[
            styles.layer,
            {
              transform: [
                {
                  rotate: layer.rotation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-360deg', '360deg'],
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
                  letterSpacing={20}
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
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 600,
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer: {
    position: 'absolute',
    width: 600,
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'absolute',
  },
  centerCircle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
```
