import type { AuditResult, AuditSummary } from "./types";

export type AuditRunResponse =
  | { ok: true; audit: AuditResult }
  | { ok: false; message: string };

const FLASK = "http://127.0.0.1:8090";

function userMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "The audit could not be completed. Please try another URL.";
}

async function fromFlask(path: string, body: unknown): Promise<AuditRunResponse | null> {
  try {
    const res = await fetch(`${FLASK}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(22000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuditRunResponse;
    if (!data || (data.ok !== true && data.ok !== false)) return null;
    return data;
  } catch {
    return null;
  }
}

async function persist(audit: AuditResult): Promise<void> {
  const { getSql } = await import("../db");
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
  await mirrorSupabase(audit);
}

async function mirrorSupabase(audit: AuditResult): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url.replace(/\/$/, "")}/rest/v1/audits`, {
      method: "POST",
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: audit.id,
        url: audit.fetchedUrl,
        score: audit.score,
        status: audit.status,
        results: JSON.stringify(audit),
        recommendations: JSON.stringify(audit.recommendations),
      }),
    });
  } catch {
    /* The project database already has the row. */
  }
}

export async function runAuditRequest(input: {
  url?: string;
  sample?: boolean;
}): Promise<AuditRunResponse> {
  try {
    if (input.sample) {
      const remote = await fromFlask("/api/sample", {});
      if (remote) {
        if (remote.ok) await persist(remote.audit);
        return remote;
      }
      const { runSampleAudit } = await import("./run-audit");
      const audit = runSampleAudit();
      await persist(audit);
      return { ok: true, audit };
    }

    const url = typeof input.url === "string" ? input.url : "";
    const remote = await fromFlask("/api/audit", { url });
    if (remote) {
      if (remote.ok) await persist(remote.audit);
      return remote;
    }
    const { runLiveAudit } = await import("./run-audit");
    const audit = await runLiveAudit(url);
    await persist(audit);
    return { ok: true, audit };
  } catch (err) {
    return { ok: false, message: userMessage(err) };
  }
}

export async function readAudit(id: string): Promise<AuditResult | null> {
  const { getSql } = await import("../db");
  const sql = await getSql();
  const rows = await sql<{ results: string }>`
    select results from audits where id = ${id} limit 1
  `;
  const raw = rows[0]?.results;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuditResult;
  } catch {
    return null;
  }
}

export async function readHistory(): Promise<AuditSummary[]> {
  const { getSql } = await import("../db");
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
}
