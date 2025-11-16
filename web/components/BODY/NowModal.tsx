"use client";

import { X } from "lucide-react";

type NowModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentCycle: {
    id: string;
    start_date: string;
    end_date: string | null;
    user_id: string;
  } | null;
  currentDay: number;
  cyclePhase: string;
  cycleLength: number;
};

export default function NowModal({
  isOpen,
  onClose,
  currentCycle,
  currentDay,
  cyclePhase,
  cycleLength,
}: NowModalProps) {
  if (!isOpen || !currentCycle) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case "menstrual":
        return "#205ea6"; // flexoki-darker-blue
      case "follicular":
        return "#1bd176"; // spring-green
      case "ovulation":
        return "#eab308"; // yellow-500
      case "luteal":
        return "#f97316"; // orange-500
      default:
        return "#d4d4d8"; // neutral
    }
  };

  const getPhaseDescription = (phase: string): string => {
    switch (phase) {
      case "menstrual":
        return "Inner winter - A time for rest, reflection, and renewal. Your energy may be lower, making it ideal for introspection and gentle self-care.";
      case "follicular":
        return "Inner spring - Energy and creativity begin to rise. This is a great time for planning, starting new projects, and social connections.";
      case "ovulation":
        return "Inner summer - Peak energy and confidence. Communication flows easily, making this ideal for important conversations and collaboration.";
      case "luteal":
        return "Inner autumn - Energy begins to turn inward. Focus on completion, organization, and preparing for the upcoming menstrual phase.";
      default:
        return "";
    }
  };

  const progressPercentage = ((currentDay - 1) / cycleLength) * 100;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-flexoki-ui rounded-xl shadow-2xl border border-flexoki-ui-3 max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b border-flexoki-ui-3">
          <h2 className="text-4xl font-bold text-flexoki-accent italic">NOW</h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-2 rounded-lg hover:bg-flexoki-ui-2 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-flexoki-tx" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Current Date */}
          <div className="text-center">
            <p className="text-sm text-flexoki-tx-3 mb-1">Today</p>
            <p className="text-lg font-semibold text-flexoki-tx">
              {formatDate(new Date().toISOString().split("T")[0])}
            </p>
          </div>

          {/* Current Cycle Day */}
          <div className="text-center">
            <div
              className="inline-flex flex-col items-center gap-2 px-8 py-4 rounded-2xl bg-flexoki-ui-2 border-2 shadow-lg"
              style={{ borderColor: getPhaseColor(cyclePhase) }}
            >
              <p className="text-lg italic text-flexoki-tx-2">Cycle Day</p>
              <div className="flex items-center gap-4">
                <p
                  className="text-6xl font-bold"
                  style={{ color: getPhaseColor(cyclePhase) }}
                >
                  {currentDay}
                </p>
                <p className="text-2xl text-flexoki-tx italic">
                  of {cycleLength}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-flexoki-tx-3">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-3 bg-flexoki-ui-3 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: getPhaseColor(cyclePhase),
                }}
              />
            </div>
          </div>

          {/* Current Phase */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getPhaseColor(cyclePhase) }}
              />
              <p className="text-lg font-semibold text-flexoki-tx capitalize">
                {cyclePhase} Phase
              </p>
            </div>
            <p className="text-xl text-flexoki-tx-2 leading-relaxed text-center italic">
              {getPhaseDescription(cyclePhase)}
            </p>
          </div>

          {/* Cycle Dates */}
          <div className="pt-4 border-t border-flexoki-ui-3">
            <div className="grid grid-cols-2 gap-8">
              {/* Cycle Start Date */}
              <div className="text-center">
                <p className="text-sm text-flexoki-tx-3 mb-1">Cycle Started</p>
                <p className="text-base text-flexoki-tx">
                  {formatDate(currentCycle.start_date)}
                </p>
              </div>

              {/* Estimated End (if available) */}
              {!currentCycle.end_date && (
                <div className="text-center">
                  <p className="text-sm text-flexoki-tx-3 mb-1">
                    Estimated End
                  </p>
                  <p className="text-base text-flexoki-tx">
                    {(() => {
                      const startDate = new Date(
                        currentCycle.start_date + "T00:00:00"
                      );
                      const estimatedEnd = new Date(startDate);
                      estimatedEnd.setDate(
                        estimatedEnd.getDate() + cycleLength - 1
                      );
                      return formatDate(
                        estimatedEnd.toISOString().split("T")[0]
                      );
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-flexoki-ui-3 bg-flexoki-ui-2">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-flexoki-accent text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
