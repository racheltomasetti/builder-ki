interface CycleInfoProps {
  cycleDay?: number | null;
  cyclePhase?: string | null;
  className?: string;
}

const CYCLE_COLORS = {
  menstrual: "#205EA6", // Blue - inner winter & reflection
  follicular: "#66800B", // Green - inner spring & growth
  ovulation: "#AD8301", // Yellow - inner summer & energy
  luteal: "#BC5215", // Orange - inner autumn & focus
  unknown: "#95A5A6", // Gray
};

const PHASE_LABELS: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
};

export default function CycleInfo({
  cycleDay,
  cyclePhase,
  className = "",
}: CycleInfoProps) {
  // Don't render if no cycle data
  if (!cycleDay || !cyclePhase) {
    return null;
  }

  const phaseColor =
    CYCLE_COLORS[cyclePhase as keyof typeof CYCLE_COLORS] ||
    CYCLE_COLORS.unknown;
  const phaseLabel = PHASE_LABELS[cyclePhase] || cyclePhase;

  return (
    <span className={`cycle-info flex items-center gap-2 ${className}`}>
      <span
        className="cycle-dot"
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: phaseColor,
        }}
      />
      <span className="text-base text-flexoki-tx-2 font-medium">
        Day {cycleDay} • {phaseLabel}
      </span>
    </span>
  );
}
