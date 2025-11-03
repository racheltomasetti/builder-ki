"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type FilterCategory = "noteType" | "cyclePhase" | "cycleDay" | "dateRange";

export type FilterPreferences = {
  showToolbar: boolean;
  enabledCategories: FilterCategory[];
};

const DEFAULT_PREFERENCES: FilterPreferences = {
  showToolbar: true,
  enabledCategories: ["noteType", "cyclePhase", "cycleDay", "dateRange"],
};

type FilterPreferencesContextType = {
  preferences: FilterPreferences;
  updatePreferences: (prefs: Partial<FilterPreferences>) => void;
  toggleToolbar: () => void;
  toggleCategory: (category: FilterCategory) => void;
};

const FilterPreferencesContext = createContext<FilterPreferencesContextType | undefined>(
  undefined
);

export function FilterPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<FilterPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("filterPreferences");
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse filter preferences:", e);
      }
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("filterPreferences", JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (prefs: Partial<FilterPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  };

  const toggleToolbar = () => {
    setPreferences((prev) => ({ ...prev, showToolbar: !prev.showToolbar }));
  };

  const toggleCategory = (category: FilterCategory) => {
    setPreferences((prev) => {
      const isEnabled = prev.enabledCategories.includes(category);
      const enabledCategories = isEnabled
        ? prev.enabledCategories.filter((c) => c !== category)
        : [...prev.enabledCategories, category];
      return { ...prev, enabledCategories };
    });
  };

  return (
    <FilterPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        toggleToolbar,
        toggleCategory,
      }}
    >
      {children}
    </FilterPreferencesContext.Provider>
  );
}

export function useFilterPreferences() {
  const context = useContext(FilterPreferencesContext);
  if (!context) {
    throw new Error("useFilterPreferences must be used within FilterPreferencesProvider");
  }
  return context;
}
