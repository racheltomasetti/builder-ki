"use client";

export default function MonthlyKey() {
  return (
    <div className="bg-flexoki-ui rounded-lg border border-flexoki-ui-3 p-2.5 text-xs">
      <div className="flex items-center justify-center gap-4">
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

        {/* Note Types (Dots) */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <span className="text-[16px] text-flexoki-tx-2">Intention</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <span className="text-[16px] text-flexoki-tx-2">Reflection</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-flexoki-accent-2"></div>
          <span className="text-[16px] text-flexoki-tx-2">Flow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-flexoki-accent"></div>
          <span className="text-[16px] text-flexoki-tx-2">Voice Capture</span>
        </div>
      </div>
    </div>
  );
}
