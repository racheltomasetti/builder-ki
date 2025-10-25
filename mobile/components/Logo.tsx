// components/KILogo.tsx (or KILogo.jsx)
import React from "react";
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
  const viewBoxSize = 100;
  const leftX = 50 - letterSpacing;
  const rightX = 50 + letterSpacing;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
    >
      {/* Symmetrical K - left side */}
      <Path
        d={`M ${leftX} 20 L ${leftX} 80 M ${leftX} 50 L ${
          leftX + 20
        } 20 M ${leftX} 50 L ${leftX + 20} 80`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dot */}
      <Circle cx="50" cy="50" r={dotSize} fill={color} />

      {/* Symmetrical I - right side (mirror of K) */}
      <Path
        d={`M ${rightX} 20 L ${rightX} 80 M ${rightX} 50 L ${
          rightX - 20
        } 20 M ${rightX} 50 L ${rightX - 20} 80`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
