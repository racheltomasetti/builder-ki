/**
 * Default Mandala Settings
 *
 * These values match the current hardcoded implementation in KIMandala.tsx
 * and serve as the baseline that users can customize and reset to.
 */

export interface MandalaSettings {
  // Colors
  color: string;
  centerCircleColor: string;

  // Base values (from current implementation)
  baseLogoSize: number;
  logoSizeIncrement: number;
  baseRadius: number;
  radiusSpacing: number;
  baseLogoCount: number;
  logoCountIncrement: number;
  baseRotationSpeed: number;
  rotationSpeedIncrement: number;

  // User-adjustable multipliers (default = 1.0 for original behavior)
  logoSizeMultiplier: number;
  logoCountMultiplier: number;
  radiusSpacingMultiplier: number;
  rotationSpeedMultiplier: number;
}

export const DEFAULT_MANDALA_SETTINGS: MandalaSettings = {
  // Colors - matching the original theme colors (yellow for layers, cyan for center)
  color: "#ad8301", // Yellow for mandala layers
  centerCircleColor: "#3aa99f", // Cyan for center circle

  // Base values - extracted from KIMandala.tsx lines 90-94
  baseLogoSize: 55,
  logoSizeIncrement: 11,
  baseRadius: 20,
  radiusSpacing: 36,
  baseLogoCount: 11,
  logoCountIncrement: 2,
  baseRotationSpeed: 5000,
  rotationSpeedIncrement: 5000,

  // Default multipliers (1.0 = original behavior)
  logoSizeMultiplier: 1.0,
  logoCountMultiplier: 1.0,
  radiusSpacingMultiplier: 1.0,
  rotationSpeedMultiplier: 1.0,
};

// Min/Max constraints for user adjustments
export const MANDALA_CONSTRAINTS = {
  logoSizeMultiplier: { min: 0.5, max: 2.0, step: 0.1 },
  logoCountMultiplier: { min: 0.5, max: 2.0, step: 0.1 },
  radiusSpacingMultiplier: { min: 0.5, max: 2.0, step: 0.1 },
  rotationSpeedMultiplier: { min: 0.3, max: 3.0, step: 0.1 },
};

// Storage key for AsyncStorage
export const MANDALA_SETTINGS_STORAGE_KEY = "@mandala_settings";
