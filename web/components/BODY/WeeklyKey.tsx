"use client";

type WeeklyKeyProps = {
  showPhaseOverlay: boolean;
  onTogglePhaseOverlay: (show: boolean) => void;
};

export default function WeeklyKey({
  showPhaseOverlay,
  onTogglePhaseOverlay,
}: WeeklyKeyProps) {
  return (
    <div className="bg-flexoki-ui rounded-lg border border-flexoki-ui-3 p-2.5 text-xs shadow-md">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-flexoki-tx-2 italic uppercase tracking-wide text-[16px] ml-2">
          Personal Legend
        </h3>

        <div className="flex items-center gap-4">
          {/* Cycle Phases (Borders) */}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-600 border-opacity-50 bg-blue-500 bg-opacity-30"></div>
            <span className="text-[16px] text-flexoki-tx-2">Menstrual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-green-600 border-opacity-50 bg-green-500 bg-opacity-30"></div>
            <span className="text-[16px] text-flexoki-tx-2">Follicular</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-yellow-600 border-opacity-50 bg-yellow-500 bg-opacity-30"></div>
            <span className="text-[16px] text-flexoki-tx-2">Ovulation</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-orange-600 border-opacity-50 bg-orange-500 bg-opacity-30"></div>
            <span className="text-[16px] text-flexoki-tx-2">Luteal</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-flexoki-tx-3"></div>

          {/* Voice Notes */}
          <div className="px-2 py-1 rounded-md bg-yellow-500 border border-yellow-500 bg-opacity-50">
            <span className="text-[16px] text-flexoki-tx italic">
              Intention
            </span>
          </div>
          <div className="px-2 py-1 rounded-md bg-purple-600 border border-purple-400 bg-opacity-50">
            <span className="text-[16px] text-flexoki-tx italic">
              Reflection
            </span>
          </div>
          <div className="px-2 py-1 rounded-md bg-red-600 border border-red-400 bg-opacity-50">
            <span className="text-[16px] text-flexoki-tx italic">
              Voice Capture
            </span>
          </div>
        </div>

        {/* Phase Overlay Toggle */}
        <button
          onClick={() => onTogglePhaseOverlay(!showPhaseOverlay)}
          className={`px-3 py-1.5 rounded-md transition-colors text-[14px] ${
            showPhaseOverlay
              ? "bg-flexoki-ui-2 bg-opacity-50 hover:italic hover:font-bold text-flexoki-tx"
              : "bg-flexoki-accent-2 hover:font-bold hover:italic text-flexoki-tx "
          }`}
        >
          {showPhaseOverlay ? "Hide Cycle Phases" : "Show Cycle Phases"}
        </button>
      </div>
    </div>
  );
}
