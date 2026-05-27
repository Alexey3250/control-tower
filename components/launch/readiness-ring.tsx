"use client";

interface ReadinessRingProps {
  value: number;
  size?: number;
  stroke?: number;
}

export function ReadinessRing({
  value,
  size = 96,
  stroke = 10,
}: ReadinessRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);
  const color =
    value >= 80
      ? "var(--jx-healthy)"
      : value >= 60
        ? "var(--jx-watch)"
        : "var(--jx-critical)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--jx-border-strong)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-2xl text-jx-text leading-none">
            {Math.round(value)}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-jx-muted mt-0.5">
            Ready
          </div>
        </div>
      </div>
    </div>
  );
}
