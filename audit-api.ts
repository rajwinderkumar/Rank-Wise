import { createServerFn } from "@tanstack/react-start";
import type { AuditResult, AuditSummary } from "./seo/types";

export type AuditRunResponse =
  | { ok: true; audit: AuditResult }
  | { ok: false; message: string };

function userMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "The audit could not be completed. Please try another URL.";
}

async function persist(audit: AuditResult): Promise<void> {
  const { getSql } = await import("./db");
  const sql = await getSql();
  await sql`
    insert into audits (id, url, score, status, results, recommendations)
    values (
      ${audit.id},
      ${audit.fetchedUrl},
      ${audit.score},
      ${audit.status},
      ${JSON.stringify(audit)},
      ${JSON.stringify(audit.recommendations)}
    )
  `;
}

export const runSeoAudit = createServerFn({ method: "POST" })
  .validator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<AuditRunResponse> => {
    try {
      const { runLiveAudit } = await import("./seo/run-audit");
      const audit = await runLiveAudit(data.url);
      await persist(audit);
      return { ok: true, audit };
    } catch (err) {
      return { ok: false, message: userMessage(err) };
    }
  });

export const runSampleSeoAudit = createServerFn({ method: "POST" }).handler(
  async (): Promise<AuditRunResponse> => {
    try {
      const { runSampleAudit } = await import("./seo/run-audit");
      const audit = runSampleAudit();
      await persist(audit);
      return { ok: true, audit };
    } catch (err) {
      return { ok: false, message: userMessage(err) };
    }
  },
);

export const getAudit = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<AuditResult | null> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{ results: string }>`
      select results from audits where id = ${data.id} limit 1
    `;
    const raw = rows[0]?.results;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuditResult;
    } catch {
      return null;
    }
  });

export const listAudits = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuditSummary[]> => {
    const { getSql } = await import("./db");
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      url: string;
      score: number;
      status: string;
      created_at: string | Date;
    }>`
      select id, url, score, status, created_at
      from audits
      order by created_at desc
      limit 24
    `;
    return rows.map((row) => ({
      id: row.id,
      url: row.url,
      score: Number(row.score),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  },
);
