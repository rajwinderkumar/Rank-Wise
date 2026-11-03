import { memo, useEffect, useRef } from "react";

type RankWiseApi = {
  mount: (el: HTMLElement, page: string, auditId?: string) => void;
  unmount: (el: HTMLElement) => void;
};

declare global {
  interface Window {
    RankWise?: RankWiseApi;
  }
}

export const RankWiseMount = memo(function RankWiseMount({
  page,
  auditId,
}: {
  page: "home" | "history" | "audit";
  auditId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    let timer = 0;

    const paint = () => {
      if (!alive || !window.RankWise) return false;
      window.RankWise.mount(el, page, auditId);
      return true;
    };

    if (!paint()) {
      timer = window.setInterval(() => {
        if (paint()) window.clearInterval(timer);
      }, 30);
    }

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.RankWise?.unmount(el);
    };
  }, [page, auditId]);

  return <div ref={ref} className="rw-mount" />;
});
