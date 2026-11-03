import { Check, ChevronDown, CircleAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { SeoCheck } from "@/lib/seo/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<SeoCheck["status"], string> = {
  pass: "Passed",
  warning: "Warning",
  error: "Error",
};

const STATUS_TONE: Record<SeoCheck["status"], string> = {
  pass: "bg-pass-soft text-pass",
  warning: "bg-warn-soft text-warn",
  error: "bg-fail-soft text-fail",
};

function StatusIcon({ status }: { status: SeoCheck["status"] }) {
  if (status === "pass") return <Check className="size-4" strokeWidth={2.2} />;
  if (status === "warning") return <TriangleAlert className="size-4" strokeWidth={2.2} />;
  return <CircleAlert className="size-4" strokeWidth={2.2} />;
}

export function CheckCard({ check }: { check: SeoCheck }) {
  const [open, setOpen] = useState(check.status !== "pass");

  return (
    <article className="rounded-xl bg-surface p-4 shadow-card sm:p-5">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
            STATUS_TONE[check.status],
          )}
        >
          <StatusIcon status={check.status} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{check.title}</span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                STATUS_TONE[check.status],
              )}
            >
              {STATUS_LABEL[check.status]}
            </span>
          </span>
          <span className="mt-1 block text-sm text-muted">{check.summary}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-subtle">
          <span className="tabular-nums text-sm">
            {check.score}/{check.maxScore}
          </span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
          <p className="text-ink-soft">{check.why}</p>
          {check.recommendation ? (
            <p className="rounded-md bg-bg-warm px-3 py-2 text-ink-soft">
              <span className="font-medium text-ink">What to do. </span>
              {check.recommendation}
            </p>
          ) : null}
          {check.items && check.items.length > 0 ? (
            <dl className="grid gap-2">
              {check.items.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3"
                >
                  <dt className="text-subtle">{item.label}</dt>
                  <dd
                    className={cn(
                      "break-all text-ink-soft",
                      item.ok === false && "text-fail",
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
