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
    <div className="bg-flexoki-ui rounded-lg border border-flexoki-ui-3 p-3 text-xs">
      <div className="flex flex-col gap-3">
        {/* Title and Controls */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-flexoki-tx uppercase tracking-wide text-[16px]">
            Legend
          </h3>
          <div className="flex items-center gap-3">
            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onJumpToCurrentCycle}
                disabled={
                  (isAtCurrentCycle && !isAllTimeView) || !onJumpToCurrentCycle
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[13px] ${
                  isAtCurrentCycle && !isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[13px] ${
                  isAtEarliestCycle && !isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90"
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
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors text-[13px] ${
                  isAllTimeView
                    ? "bg-flexoki-accent text-white hover:bg-opacity-90"
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
              className="px-3 py-1.5 rounded-md bg-flexoki-ui-2 hover:bg-flexoki-ui-3 transition-colors text-[14px] text-flexoki-tx-2"
            >
              {showPhaseOverlay ? "Hide Cycle Phases" : "Show Cycle Phases"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-flexoki-ui-3"></div>

        {/* Three Columns: Data Points | Cycle Phases | Positioning */}
        <div className="grid grid-cols-3 gap-6">
          {/* Column 1: Data Point Types */}
          <div>
            <h4 className="text-[13px] font-semibold text-flexoki-tx-2 mb-2">
              Data Points
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: "#D4A574",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  }}
                ></div>
                <span className="text-[14px] text-flexoki-tx-2">Intention</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: "#A274D4",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  }}
                ></div>
                <span className="text-[14px] text-flexoki-tx-2">
                  Reflection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: "#D47474",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  }}
                ></div>
                <span className="text-[14px] text-flexoki-tx-2">
                  Voice Capture
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: "#74D4A5",
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                  }}
                ></div>
                <span className="text-[14px] text-flexoki-tx-2">Media</span>
              </div>
            </div>
          </div>

          {/* Column 2: Cycle Phases */}
          <div>
            <h4 className="text-[13px] font-semibold text-flexoki-tx-2 mb-2">
              Cycle Phases
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-blue-600 border-opacity-50 bg-blue-500 opacity-30"></div>
                <span className="text-[14px] text-flexoki-tx-2">Menstrual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-green-600 border-opacity-50 bg-green-500 opacity-30"></div>
                <span className="text-[14px] text-flexoki-tx-2">
                  Follicular
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-yellow-600 border-opacity-50 bg-yellow-500 opacity-30"></div>
                <span className="text-[14px] text-flexoki-tx-2">Ovulation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-orange-600 border-opacity-50 bg-orange-500 opacity-30"></div>
                <span className="text-[14px] text-flexoki-tx-2">Luteal</span>
              </div>
            </div>
          </div>

          {/* Column 3: Positioning Info */}
          <div>
            <h4 className="text-[13px] font-semibold text-flexoki-tx-2 mb-2">
              Positioning
            </h4>
            <div className="space-y-1.5">
              <div>
                <div className="text-[14px] text-flexoki-tx-2">
                  <strong>Radial:</strong> Time of day
                </div>
                <div className="text-[13px] text-flexoki-tx-3 italic pl-2">
                  (center = morning, outer = evening)
                </div>
              </div>
              <div>
                <div className="text-[14px] text-flexoki-tx-2">
                  <strong>Angular:</strong> Cycle day
                </div>
                <div className="text-[13px] text-flexoki-tx-3 italic pl-2">
                  (Day 1 at top, clockwise)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
