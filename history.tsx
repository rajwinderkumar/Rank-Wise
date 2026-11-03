import { createFileRoute } from "@tanstack/react-router";
import { RankWiseMount } from "@/components/rank-wise-mount";

export const Route = createFileRoute("/history")({
  component: function HistoryPage() {
    return <RankWiseMount page="history" />;
  },
});
