import { createFileRoute } from "@tanstack/react-router";
import { readAudit } from "@/lib/seo/gateway";

export const Route = createFileRoute("/api/seo/$auditId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const audit = await readAudit(params.auditId);
        if (!audit) return Response.json({ message: "Audit not found" }, { status: 404 });
        return Response.json(audit);
      },
    },
  },
});
