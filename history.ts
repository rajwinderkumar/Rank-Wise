import { createFileRoute } from "@tanstack/react-router";
import { readHistory } from "@/lib/seo/gateway";

export const Route = createFileRoute("/api/seo/history")({
  server: {
    handlers: {
      GET: async () => Response.json({ audits: await readHistory() }),
    },
  },
});
