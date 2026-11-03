import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock3,
  Globe,
  Image as ImageIcon,
  Link2,
  Type,
} from "lucide-react";
import { CheckCard } from "@/components/check-card";
import { ScoreGauge } from "@/components/score-gauge";
import type { AuditResult } from "@/lib/seo/types";
import { formatRelativeTime } from "@/lib/utils";

const STAT_TONE = {
  pass: "text-pass",
  warning: "text-warn",
  error: "text-fail",
} as const;

export function AuditReport({ audit }: { audit: AuditResult }) {
  const host = (() => {
    try {
      return new URL(audit.fetchedUrl).hostname;
    } catch {
      return audit.url;
    }
  })();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          New audit
        </Link>
        {audit.sample ? (
          <p className="rounded-sm bg-accent-soft px-2 py-1 text-xs font-medium uppercase tracking-wider text-accent">
            Sample report
          </p>
        ) : null}
      </div>

      <section className="grid gap-6 rounded-xl bg-surface p-5 shadow-card lg:grid-cols-[16rem_1fr] lg:p-8">
        <ScoreGauge score={audit.score} grade={audit.grade} status={audit.status} />
        <div className="flex min-w-0 flex-col justify-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-subtle">Audited site</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {host}
            </h1>
            <a
              href={audit.fetchedUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block break-all text-sm text-accent hover:underline"
            >
              {audit.fetchedUrl}
            </a>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Passed" value={audit.passed} tone="pass" />
            <Stat label="Warnings" value={audit.warnings} tone="warning" />
            <Stat label="Errors" value={audit.errors} tone="error" />
            <Stat label="HTTP" value={audit.statusCode} />
          </dl>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {formatRelativeTime(audit.analyzedAt)}
            </span>
            <span>Fetched in {audit.fetchMs} ms</span>
          </p>
        </div>
      </section>

      {audit.recommendations.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Recommendations
          </h2>
          <ol className="grid gap-3">
            {audit.recommendations.map((item, index) => (
              <li
                key={`${item.checkId}-${index}`}
                className="rounded-xl bg-surface p-4 shadow-card sm:p-5"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-subtle">
                  {String(index + 1).padStart(2, "0")} · {item.priority}
                </p>
                <p className="mt-1 font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="rounded-xl bg-pass-soft px-5 py-4 text-pass">
          This page passed the selected checks. Keep titles unique as the site grows.
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Page snapshot
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Snapshot
            icon={Type}
            label="Title"
            value={audit.page.title ?? "Missing"}
          />
          <Snapshot
            icon={Globe}
            label="Headings"
            value={`H1 ${audit.page.h1Count} · H2 ${audit.page.h2Count} · H3 ${audit.page.h3Count}`}
          />
          <Snapshot
            icon={ImageIcon}
            label="Images"
            value={`${audit.page.imageCount} total · ${audit.page.missingAltCount} missing alt`}
          />
          <Snapshot
            icon={Link2}
            label="Links"
            value={`${audit.page.internalLinks} internal · ${audit.page.externalLinks} external`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Individual checks
        </h2>
        <div className="grid gap-3">
          {audit.checks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: keyof typeof STAT_TONE;
}) {
  return (
    <div className="rounded-lg bg-bg-warm px-3 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-subtle">{label}</p>
      <p
        className={`mt-1 font-display text-2xl font-semibold tabular-nums ${tone ? STAT_TONE[tone] : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Snapshot({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Type;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-subtle">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm leading-snug text-ink-soft">{value}</p>
    </div>
  );
}
