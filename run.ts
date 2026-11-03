import { createFileRoute } from "@tanstack/react-router";
import { runAuditRequest } from "@/lib/seo/gateway";

export const Route = createFileRoute("/api/seo/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { url?: string; sample?: boolean } = {};
        try {
          body = (await request.json()) as { url?: string; sample?: boolean };
        } catch {
          body = {};
        }
        const result = await runAuditRequest({
          url: typeof body.url === "string" ? body.url : "",
          sample: body.sample === true,
        });
        return Response.json(result);
      },
    },
  },
});
