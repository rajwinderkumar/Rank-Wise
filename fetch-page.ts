import { isPrivateHostname, isPrivateIp, normalizeAuditUrl } from "./url";

export class AuditFetchError extends Error {
  constructor(
    message: string,
    readonly code:
      | "blocked"
      | "timeout"
      | "http"
      | "network"
      | "too_large"
      | "unsupported",
  ) {
    super(message);
    this.name = "AuditFetchError";
  }
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; RankWise/1.0; educational SEO auditor)";
const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 14_000;
const MAX_REDIRECTS = 5;

async function assertPublicHost(url: URL): Promise<void> {
  if (isPrivateHostname(url.hostname)) {
    throw new AuditFetchError("That address cannot be audited.", "blocked");
  }
  try {
    const { lookup } = await import("node:dns/promises");
    const results = await lookup(url.hostname, { all: true });
    for (const row of results) {
      if (isPrivateIp(row.address)) {
        throw new AuditFetchError("That address cannot be audited.", "blocked");
      }
    }
  } catch (err) {
    if (err instanceof AuditFetchError) throw err;
  }
}

async function readLimited(response: Response): Promise<string> {
  const length = Number(response.headers.get("content-length") ?? "0");
  if (length > MAX_BYTES) {
    throw new AuditFetchError(
      "The page is too large to analyse in this project.",
      "too_large",
    );
  }
  if (!response.body) return await response.text();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      if (received > MAX_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        throw new AuditFetchError(
          "The page is too large to analyse in this project.",
          "too_large",
        );
      }
      chunks.push(value);
    }
  }
  const all = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const charset =
    response.headers.get("content-type")?.match(/charset=([^;]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset, { fatal: false }).decode(all);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(all);
  }
}

export type FetchedResource = {
  url: string;
  status: number;
  ok: boolean;
  body: string;
  contentType: string;
  ms: number;
};

export async function fetchResource(
  url: string,
  opts?: { accept?: string },
): Promise<FetchedResource> {
  const started = Date.now();
  const parsed = new URL(url);
  await assertPublicHost(parsed);

  let current = parsed;
  let response: Response | null = null;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicHost(current);
    try {
      response = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: opts?.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof AuditFetchError) throw err;
      const name = err instanceof Error ? err.name : "";
      if (name === "TimeoutError" || name === "AbortError") {
        throw new AuditFetchError(
          "The website took too long to respond. Try again or use another URL.",
          "timeout",
        );
      }
      throw new AuditFetchError(
        "The website could not be reached. Check the URL and try again.",
        "network",
      );
    }

    const location = response.headers.get("location");
    if (
      [301, 302, 303, 307, 308].includes(response.status) &&
      location &&
      hop < MAX_REDIRECTS
    ) {
      current = new URL(location, current);
      continue;
    }
    break;
  }

  if (!response) {
    throw new AuditFetchError("The website could not be reached.", "network");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await readLimited(response);

  return {
    url: current.toString(),
    status: response.status,
    ok: response.ok,
    body,
    contentType,
    ms: Date.now() - started,
  };
}

export async function fetchWebpage(inputUrl: string): Promise<FetchedResource> {
  const target = normalizeAuditUrl(inputUrl);
  const page = await fetchResource(target.toString());
  if (page.status === 404) {
    throw new AuditFetchError("The page was not found (404).", "http");
  }
  if (page.status === 401 || page.status === 403) {
    throw new AuditFetchError(
      "The website blocked the audit request. Some sites do not allow automated checks.",
      "http",
    );
  }
  if (page.status >= 400) {
    throw new AuditFetchError(
      `The website returned HTTP ${page.status} and could not be analysed.`,
      "http",
    );
  }
  const looksHtml =
    /html|xml|text\/plain/i.test(page.contentType) ||
    /<html|<head|<title|<body/i.test(page.body.slice(0, 4000));
  if (!looksHtml) {
    throw new AuditFetchError(
      "That URL did not return a webpage we can read.",
      "unsupported",
    );
  }
  return page;
}
