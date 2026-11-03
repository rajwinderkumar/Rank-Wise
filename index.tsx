import { createFileRoute } from "@tanstack/react-router";
import { RankWiseMount } from "@/components/rank-wise-mount";

export const Route = createFileRoute("/")({
  component: function Home() {
    return <RankWiseMount page="home" />;
  },
});
