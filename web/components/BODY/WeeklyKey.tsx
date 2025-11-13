"use client";

export default function WeeklyKey() {
  return (
    <div className="bg-flexoki-ui rounded-lg border border-flexoki-ui-3 p-2.5 text-xs">
      <div className="flex items-center gap-4">
        <h3 className="font-semibold text-flexoki-tx uppercase tracking-wide text-[16px]">
          Legend:
        </h3>

        {/* Cycle Phases */}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 bg-opacity-50 border border-blue-200"></div>
          <span className="text-[16px] text-flexoki-tx-2">Menstrual</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-50 bg-opacity-50 border border-green-200"></div>
          <span className="text-[16px] text-flexoki-tx-2">Follicular</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-50 bg-opacity-50 border border-yellow-200"></div>
          <span className="text-[16px] text-flexoki-tx-2">Ovulation</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-50 bg-opacity-50 border border-orange-200"></div>
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
          <span className="text-[16px] text-flexoki-tx-2">General</span>
        </div>
      </div>
    </div>
  );
}
