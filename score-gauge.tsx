import type { AuditGrade, CheckStatus } from "@/lib/seo/types";
import { cn } from "@/lib/utils";

const STATUS_STROKE: Record<CheckStatus, string> = {
  pass: "stroke-pass",
  warning: "stroke-warn",
  error: "stroke-fail",
};

export function ScoreGauge({
  score,
  grade,
  status,
}: {
  score: number;
  grade: AuditGrade;
  status: CheckStatus;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-40">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            className="stroke-border"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            className={cn(STATUS_STROKE[status], "transition-[stroke-dashoffset] duration-500")}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold tabular-nums leading-none tracking-tight">
            {clamped}
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
            of 100
          </span>
        </div>
      </div>
      <p className="font-display text-xl font-medium tracking-tight">{grade}</p>
    </div>
  );
}
