import { cn } from "@/lib/utils";

export function RankWiseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-accent" />
      <rect x="7" y="18" width="4.5" height="7" rx="1" className="fill-accent-fg" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="1" className="fill-accent-fg" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1" className="fill-accent-fg" />
    </svg>
  );
}
