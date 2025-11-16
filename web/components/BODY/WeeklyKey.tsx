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
    <div className="bg-flexoki-ui rounded-lg border border-flexoki-ui-3 p-2.5 text-xs">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-flexoki-tx uppercase tracking-wide text-[16px]">
            Legend:
          </h3>

        {/* Cycle Phases (Borders) */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-blue-600 border-opacity-50 bg-flexoki-ui-2"></div>
          <span className="text-[16px] text-flexoki-tx-2">Menstrual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-green-600 border-opacity-50 bg-flexoki-ui-2"></div>
          <span className="text-[16px] text-flexoki-tx-2">Follicular</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-yellow-600 border-opacity-50 bg-flexoki-ui-2"></div>
          <span className="text-[16px] text-flexoki-tx-2">Ovulation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-orange-600 border-opacity-50 bg-flexoki-ui-2"></div>
          <span className="text-[16px] text-flexoki-tx-2">Luteal</span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-flexoki-ui-3"></div>

        {/* Voice Notes */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-yellow-100 border border-yellow-500 opacity-70"></div>
          <span className="text-[16px] text-flexoki-tx-2">Intention</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded-sm bg-purple-100 border border-purple-400 opacity-70"></div>
          <span className="text-[16px] text-flexoki-tx-2">Reflection</span>
        </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-red-100 border border-red-400 opacity-70"></div>
            <span className="text-[16px] text-flexoki-tx-2">Voice Capture</span>
          </div>
        </div>

        {/* Phase Overlay Toggle */}
        <button
          onClick={() => onTogglePhaseOverlay(!showPhaseOverlay)}
          className="px-3 py-1.5 rounded-md bg-flexoki-ui-2 hover:bg-flexoki-ui-3 transition-colors text-[14px] text-flexoki-tx-2"
        >
          {showPhaseOverlay ? "Hide Cycle Phases" : "Show Cycle Phases"}
        </button>
      </div>
    </div>
  );
}
