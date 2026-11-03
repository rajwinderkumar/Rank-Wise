import { Link } from "@tanstack/react-router";
import { RankWiseMark } from "@/components/rank-wise-mark";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <RankWiseMark className="size-8" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Rank Wise
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-ink-soft hover:bg-bg-warm hover:text-ink"
          >
            Audit
          </Link>
          <Link
            to="/history"
            className="rounded-md px-3 py-2 text-ink-soft hover:bg-bg-warm hover:text-ink"
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}
