"use client";

import { useState } from "react";
import CustomDropdown from "./CustomDropdown";

type FilterState = {
  noteType: string;
  cyclePhase: string;
  cycleDay: string;
  dateRange: string;
  customDateStart?: string;
  customDateEnd?: string;
};

type FilterToolbarProps = {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
};

const CYCLE_COLORS = {
  menstrual: "#205EA6",
  follicular: "#66800B",
  ovulation: "#AD8301",
  luteal: "#BC5215",
};

export default function FilterToolbar({
  filters,
  onFiltersChange,
}: FilterToolbarProps) {
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };

    // Reset custom dates if switching away from custom
    if (key === "dateRange" && value !== "custom") {
      delete newFilters.customDateStart;
      delete newFilters.customDateEnd;
      setShowCustomDatePicker(false);
    }

    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      noteType: "all",
      cyclePhase: "all",
      cycleDay: "all",
      dateRange: "all_time",
    });
    setShowCustomDatePicker(false);
  };

  const hasActiveFilters =
    filters.noteType !== "all" ||
    filters.cyclePhase !== "all" ||
    filters.cycleDay !== "all" ||
    filters.dateRange !== "all_time";

  const getActiveFilterLabels = () => {
    const labels: Array<{ key: string; label: string }> = [];

    if (filters.noteType !== "all") {
      labels.push({
        key: "noteType",
        label:
          filters.noteType.charAt(0).toUpperCase() + filters.noteType.slice(1),
      });
    }

    if (filters.cyclePhase !== "all") {
      const phaseLabel =
        filters.cyclePhase === "no_cycle_data"
          ? "No Cycle Data"
          : filters.cyclePhase.charAt(0).toUpperCase() +
            filters.cyclePhase.slice(1);
      labels.push({ key: "cyclePhase", label: phaseLabel });
    }

    if (filters.cycleDay !== "all") {
      labels.push({ key: "cycleDay", label: `Day ${filters.cycleDay}` });
    }

    if (filters.dateRange !== "all_time") {
      let dateLabel = filters.dateRange.replace(/_/g, " ");
      dateLabel = dateLabel
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      labels.push({ key: "dateRange", label: dateLabel });
    }

    return labels;
  };

  const handleCustomDateChange = () => {
    if (filters.customDateStart && filters.customDateEnd) {
      setShowCustomDatePicker(false);
    }
  };

  return (
    <div className="mb-6 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg p-6 shadow-sm">
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-flexoki-tx uppercase tracking-wide">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-flexoki-accent hover:underline font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* Note Type Filter */}
        <CustomDropdown
          value={filters.noteType}
          onChange={(value) => updateFilter("noteType", value)}
          options={[
            { value: "all", label: "All Note Types" },
            { value: "general", label: "General" },
            { value: "intention", label: "Intention" },
            { value: "daily", label: "Daily" },
            { value: "reflection", label: "Reflection" },
          ]}
        />

        {/* Cycle Phase Filter */}
        <CustomDropdown
          value={filters.cyclePhase}
          onChange={(value) => updateFilter("cyclePhase", value)}
          options={[
            { value: "all", label: "All Cycle Phases" },
            { value: "menstrual", label: "🔵 Menstrual" },
            { value: "follicular", label: "🟢 Follicular" },
            { value: "ovulation", label: "🟡 Ovulation" },
            { value: "luteal", label: "🟠 Luteal" },
            { value: "no_cycle_data", label: "No Cycle Data" },
          ]}
        />

        {/* Cycle Day Filter */}
        <CustomDropdown
          value={filters.cycleDay}
          onChange={(value) => updateFilter("cycleDay", value)}
          options={[
            { value: "all", label: "All Cycle Days" },
            ...Array.from({ length: 28 }, (_, i) => ({
              value: (i + 1).toString(),
              label: `Day ${i + 1}`,
            })),
          ]}
        />

        {/* Date Range Filter */}
        <CustomDropdown
          value={filters.dateRange}
          onChange={(value) => {
            updateFilter("dateRange", value);
            if (value === "custom") {
              setShowCustomDatePicker(true);
            }
          }}
          options={[
            { value: "all_time", label: "All Time" },
            { value: "last_7_days", label: "Last 7 Days" },
            { value: "last_30_days", label: "Last 30 Days" },
            { value: "this_month", label: "This Month" },
            { value: "last_month", label: "Last Month" },
            { value: "custom", label: "Custom Range" },
          ]}
        />
      </div>

      {/* Custom Date Picker */}
      {showCustomDatePicker && filters.dateRange === "custom" && (
        <div className="mb-3 p-4 bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg">
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm text-flexoki-tx-2 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.customDateStart || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    customDateStart: e.target.value,
                  });
                }}
                className="px-3 py-2 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx focus:outline-none focus:ring-2 focus:ring-flexoki-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-flexoki-tx-2 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.customDateEnd || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    customDateEnd: e.target.value,
                  });
                }}
                className="px-3 py-2 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx focus:outline-none focus:ring-2 focus:ring-flexoki-accent"
              />
            </div>
            <button
              onClick={handleCustomDateChange}
              disabled={!filters.customDateStart || !filters.customDateEnd}
              className="mt-6 px-4 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-flexoki-tx-2">Active filters:</span>
          {getActiveFilterLabels().map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-2 px-3 py-1 bg-flexoki-accent/20 text-flexoki-accent rounded-full text-sm"
            >
              {filter.label}
              <button
                onClick={() => {
                  if (filter.key === "noteType")
                    updateFilter("noteType", "all");
                  if (filter.key === "cyclePhase")
                    updateFilter("cyclePhase", "all");
                  if (filter.key === "cycleDay")
                    updateFilter("cycleDay", "all");
                  if (filter.key === "dateRange")
                    updateFilter("dateRange", "all_time");
                }}
                className="hover:text-flexoki-tx transition-colors"
                title={`Remove ${filter.label} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
