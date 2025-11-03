import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MandalaSettings,
  DEFAULT_MANDALA_SETTINGS,
  MANDALA_SETTINGS_STORAGE_KEY,
} from "../constants/mandalaDefaults";

export const useMandalaSettings = () => {
  const [settings, setSettings] = useState<MandalaSettings>(
    DEFAULT_MANDALA_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(MANDALA_SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Migration: Convert old 'color' and 'centerCircleColor' properties
        let needsMigration = false;
        const migratedSettings: MandalaSettings = {
          ...DEFAULT_MANDALA_SETTINGS,
          ...parsed,
        };

        // Convert old 'color' to 'layerColors' array
        if (parsed.color && !parsed.layerColors) {
          migratedSettings.layerColors = [parsed.color, DEFAULT_MANDALA_SETTINGS.layerColors[1]] as [string, string];
          delete (migratedSettings as any).color;
          needsMigration = true;
        }

        // Remove old 'centerCircleColor' (now using theme-aware color)
        if (parsed.centerCircleColor) {
          delete (migratedSettings as any).centerCircleColor;
          needsMigration = true;
        }

        if (needsMigration) {
          // Save migrated settings
          await AsyncStorage.setItem(
            MANDALA_SETTINGS_STORAGE_KEY,
            JSON.stringify(migratedSettings)
          );
          setSettings(migratedSettings);
        } else {
          setSettings(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load mandala settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = useCallback(async (newSettings: MandalaSettings) => {
    try {
      await AsyncStorage.setItem(
        MANDALA_SETTINGS_STORAGE_KEY,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save mandala settings:", error);
    }
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<MandalaSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      // Note: We'll save on "Apply" button press, not immediately
      return newSettings;
    },
    [settings]
  );

  const resetToDefaults = useCallback(async () => {
    await saveSettings(DEFAULT_MANDALA_SETTINGS);
  }, [saveSettings]);

  return {
    settings,
    isLoading,
    updateSettings,
    saveSettings,
    resetToDefaults,
    loadSettings, // Expose for manual reloading
  };
};
