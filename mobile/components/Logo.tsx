// components/KILogo.tsx
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

interface KILogoProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  dotSize?: number;
  letterSpacing?: number;
}

export const KILogo: React.FC<KILogoProps> = ({
  size = 60,
  color = "#3B82F6",
  strokeWidth = 2,
  dotSize = 3,
  letterSpacing = 20,
}) => {
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
  const viewBoxSize = 100;
  const leftX = 50 - letterSpacing;
  const rightX = 50 + letterSpacing;

  // Calculate perfect square dimensions
  const squareHeight = rightX - leftX; // Width of square
  const centerY = 50; // Vertical center
  const topY = centerY - squareHeight / 2;
  const bottomY = centerY + squareHeight / 2;

  // Calculate circle radius - the diagonal of the square divided by 2
  const circleRadius = (squareHeight * Math.sqrt(2)) / 2;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: bobbingAnim }],
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
      {/* Circle that touches all four corners of the square */}
      <Circle
        cx="50"
        cy="50"
        r={circleRadius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Perfect square frame */}
      <Path
        d={`M ${leftX} ${topY} L ${rightX} ${topY} L ${rightX} ${bottomY} L ${leftX} ${bottomY} Z`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Left K vertical stem */}
      <Path
        d={`M ${leftX} ${topY} L ${leftX} ${bottomY}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Left K diagonals forming diamond - meeting at center */}
      <Path
        d={`M ${leftX} ${centerY} L 50 ${topY} M ${leftX} ${centerY} L 50 ${bottomY}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Right K vertical stem */}
      <Path
        d={`M ${rightX} ${topY} L ${rightX} ${bottomY}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />

      {/* Right K diagonals forming diamond - meeting at center */}
      <Path
        d={`M ${rightX} ${centerY} L 50 ${topY} M ${rightX} ${centerY} L 50 ${bottomY}`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dot */}
      <Circle cx="50" cy="50" r={dotSize} fill={color} />
    </Svg>
    </Animated.View>
  );
};
