"use client";

import { CalendarDays, Clock, Globe } from "lucide-react";

type CycleKeyProps = {
  showPhaseOverlay: boolean;
  onTogglePhaseOverlay: (show: boolean) => void;
  onJumpToCurrentCycle?: () => void;
  onJumpToEarliestCycle?: () => void;
  onToggleAllTimeView?: () => void;
  isAtCurrentCycle?: boolean;
  isAtEarliestCycle?: boolean;
  isAllTimeView?: boolean;
};

export default function CycleKey({
  showPhaseOverlay,
  onTogglePhaseOverlay,
  onJumpToCurrentCycle,
  onJumpToEarliestCycle,
  onToggleAllTimeView,
  isAtCurrentCycle = false,
  isAtEarliestCycle = false,
  isAllTimeView = false,
}: CycleKeyProps) {
  return (
    <div className="bg-flexoki-ui-2 rounded-lg border border-flexoki-ui-3 p-3 text-xs shadow-md">
      <div className="flex flex-col gap-3">
        {/* Title and Controls */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-flexoki-tx-2 italic uppercase tracking-wide text-[20px] ml-2">
            Personal Legend
          </h3>
          <div className="flex items-center gap-3">
            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onJumpToCurrentCycle}
                disabled={
                  (isAtCurrentCycle && !isAllTimeView) || !onJumpToCurrentCycle
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[16px] ${
                  isAtCurrentCycle && !isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90 italic"
                    : "bg-flexoki-ui-2 text-flexoki-tx-2 hover:bg-flexoki-ui-3"
                } disabled:cursor-not-allowed`}
                title="Jump to Current Cycle"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Current</span>
              </button>
              <button
                onClick={onJumpToEarliestCycle}
                disabled={
                  (isAtEarliestCycle && !isAllTimeView) ||
                  !onJumpToEarliestCycle
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[16px] ${
                  isAtEarliestCycle && !isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90 italic"
                    : "bg-flexoki-ui-2 text-flexoki-tx-2 hover:bg-flexoki-ui-3"
                } disabled:cursor-not-allowed`}
                title="Jump to Earliest Cycle"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Earliest</span>
              </button>
              <button
                onClick={onToggleAllTimeView}
                disabled={!onToggleAllTimeView}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[16px] ${
                  isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90 italic"
                    : "bg-flexoki-ui-2 text-flexoki-tx-2 hover:bg-flexoki-ui-3"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title="View All Time"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Time</span>
              </button>
            </div>
            {/* Phase Toggle */}
            <button
              onClick={() => onTogglePhaseOverlay(!showPhaseOverlay)}
              className={`px-3 py-1.5 rounded-md transition-colors text-[16px] ${
                showPhaseOverlay
                  ? "bg-flexoki-ui-3 bg-opacity-50 hover:italic hover:font-bold text-flexoki-tx"
                  : "bg-flexoki-ui-3 hover:font-bold hover:italic text-flexoki-tx "
              }`}
            >
              {showPhaseOverlay ? "Hide Cycle Phases" : "Show Cycle Phases"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-flexoki-tx-3"></div>

        {/* Single horizontal row of all legend items */}
        <div className="flex items-center justify-center gap-4">
          {/* Data Point Types */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#D4A574",
                border: "2px solid #D4A574",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            ></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Intention
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#A274D4",
                border: "2px solid #A274D4",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            ></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Reflection
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#af3029",
                border: "2px solid #af3029",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            ></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Voice Capture
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#3aa99f",
                border: "2px solid #3aa99f",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            ></div>
            <span className="text-[18px] text-flexoki-tx italic">Media</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-flexoki-tx-3"></div>

          {/* Cycle Phases */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-blue-600 border-opacity-50 bg-blue-500 opacity-30"></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Menstrual
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-green-600 border-opacity-50 bg-green-500 opacity-30"></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Follicular
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-yellow-600 border-opacity-50 bg-yellow-500 opacity-30"></div>
            <span className="text-[18px] text-flexoki-tx italic">
              Ovulation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-orange-600 border-opacity-50 bg-orange-500 opacity-30"></div>
            <span className="text-[18px] text-flexoki-tx italic">Luteal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
