import { createFileRoute } from "@tanstack/react-router";
import { RankWiseMount } from "@/components/rank-wise-mount";

export const Route = createFileRoute("/audit/$auditId")({
  component: function AuditPage() {
    const { auditId } = Route.useParams();
    return <RankWiseMount page="audit" auditId={auditId} />;
  },
});
