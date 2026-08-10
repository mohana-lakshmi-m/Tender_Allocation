import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel, TenderStatus } from "@/services/types";

export function riskTone(score: number) {
  if (score < 30) return "success" as const;
  if (score < 65) return "warning" as const;
  return "destructive" as const;
}

const TONE_CLASS = {
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  destructive: "border-destructive/45 bg-destructive/10 text-destructive",
  primary: "border-primary/40 bg-primary/10 text-primary",
  accent: "border-accent/50 bg-accent/15 text-accent-foreground",
  muted: "border-border bg-surface-raised text-muted-foreground",
} as const;

export type Tone = keyof typeof TONE_CLASS;

export function Pill({
  tone = "muted",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function IntegrityBadge({ score }: { score: number }) {
  const tone = riskTone(score);
  const label = tone === "success" ? "Low Risk" : tone === "warning" ? "Medium Risk" : "High Risk";
  return (
    <Pill tone={tone}>
      {100 - score}% · {label}
    </Pill>
  );
}

const STATUS_TONE: Record<TenderStatus, Tone> = {
  Open: "primary",
  Auditing: "warning",
  Allocated: "success",
  Flagged: "destructive",
};

export function StatusBadge({ status }: { status: TenderStatus }) {
  return <Pill tone={STATUS_TONE[status]}>{status}</Pill>;
}

const RISK_TONE: Record<RiskLevel, Tone> = {
  Low: "success",
  Medium: "warning",
  Critical: "destructive",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Pill tone={RISK_TONE[level]}>{level}</Pill>;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="panel hairline-top relative overflow-hidden p-3">
      <p className="mono-xs uppercase text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
