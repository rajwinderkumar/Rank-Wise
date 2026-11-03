import {
  checkHeadings,
  checkImages,
  checkLinks,
  checkMeta,
  checkRobots,
  checkSitemap,
  checkTitle,
  checkUrlStructure,
} from "./checks";
import { fetchWebpage } from "./fetch-page";
import { parseHtml } from "./html";
import { SAMPLE_HTML, SAMPLE_URL } from "./sample";
import { checkTechnicalFiles } from "./technical";
import type {
  AuditGrade,
  AuditResult,
  CheckStatus,
  ParsedPage,
  Recommendation,
  SeoCheck,
  TechnicalFiles,
} from "./types";
import { normalizeAuditUrl } from "./url";

function gradeFor(score: number): AuditGrade {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Poor";
}

function overallStatus(score: number, checks: SeoCheck[]): CheckStatus {
  const errors = checks.filter((c) => c.status === "error").length;
  if (score < 50 || errors >= 3) return "error";
  if (score < 85 || errors > 0 || checks.some((c) => c.status === "warning")) {
    return "warning";
  }
  return "pass";
}

function buildRecommendations(checks: SeoCheck[]): Recommendation[] {
  const order: CheckStatus[] = ["error", "warning"];
  const out: Recommendation[] = [];
  for (const status of order) {
    for (const check of checks) {
      if (check.status !== status || !check.recommendation) continue;
      out.push({
        title: check.title,
        body: check.recommendation,
        checkId: check.id,
        priority: status,
      });
    }
  }
  return out;
}

function countLinks(page: ParsedPage, pageUrl: string) {
  let internal = 0;
  let external = 0;
  let pageHost = "";
  try {
    pageHost = new URL(pageUrl).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    pageHost = "";
  }
  for (const link of page.links) {
    const href = link.href.trim();
    if (!href || href.startsWith("#") || /^(javascript|mailto|tel):/i.test(href)) {
      continue;
    }
    try {
      const resolved = new URL(href, page.baseHref ? new URL(page.baseHref, pageUrl) : pageUrl);
      const host = resolved.hostname.replace(/^www\./i, "").toLowerCase();
      if (host === pageHost) internal += 1;
      else external += 1;
    } catch {
      /* skip */
    }
  }
  return { internal, external };
}

function assemble(input: {
  id: string;
  requested: string;
  fetchedUrl: string;
  statusCode: number;
  fetchMs: number;
  sample: boolean;
  page: ParsedPage;
  tech: TechnicalFiles;
}): AuditResult {
  const checks: SeoCheck[] = [
    checkTitle(input.page),
    checkMeta(input.page),
    checkHeadings(input.page),
    checkImages(input.page),
    checkLinks(input.page, input.fetchedUrl),
    checkUrlStructure(input.fetchedUrl),
    checkRobots(input.tech),
    checkSitemap(input.tech),
  ];
  const score = Math.round(
    checks.reduce((sum, check) => sum + check.score, 0),
  );
  const { internal, external } = countLinks(input.page, input.fetchedUrl);
  const recommendations = buildRecommendations(checks);
  return {
    id: input.id,
    url: input.requested,
    normalizedUrl: input.fetchedUrl,
    fetchedUrl: input.fetchedUrl,
    statusCode: input.statusCode,
    fetchMs: input.fetchMs,
    analyzedAt: new Date().toISOString(),
    sample: input.sample,
    score,
    grade: gradeFor(score),
    status: overallStatus(score, checks),
    passed: checks.filter((c) => c.status === "pass").length,
    warnings: checks.filter((c) => c.status === "warning").length,
    errors: checks.filter((c) => c.status === "error").length,
    checks,
    recommendations,
    page: {
      title: input.page.title,
      metaDescription: input.page.metaDescription,
      h1Count: input.page.headings.h1.length,
      h2Count: input.page.headings.h2.length,
      h3Count: input.page.headings.h3.length,
      imageCount: input.page.images.length,
      missingAltCount: input.page.images.filter((img) => !img.hasAltAttr).length,
      internalLinks: internal,
      externalLinks: external,
      robotsFound: input.tech.robots.found,
      sitemapFound: input.tech.sitemap.found,
    },
  };
}

export async function runLiveAudit(rawUrl: string): Promise<AuditResult> {
  const target = normalizeAuditUrl(rawUrl);
  const pageRes = await fetchWebpage(target.toString());
  const parsed = parseHtml(pageRes.body);
  const tech = await checkTechnicalFiles(pageRes.url);
  return assemble({
    id: crypto.randomUUID(),
    requested: rawUrl.trim(),
    fetchedUrl: pageRes.url,
    statusCode: pageRes.status,
    fetchMs: pageRes.ms,
    sample: false,
    page: parsed,
    tech,
  });
}

export function runSampleAudit(): AuditResult {
  const parsed = parseHtml(SAMPLE_HTML);
  const tech: TechnicalFiles = {
    robots: {
      found: true,
      status: 200,
      sitemapUrls: [`${SAMPLE_URL}sitemap.xml`],
      snippet: "User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml",
    },
    sitemap: {
      found: true,
      status: 200,
      url: `${SAMPLE_URL}sitemap.xml`,
    },
  };
  return assemble({
    id: crypto.randomUUID(),
    requested: SAMPLE_URL,
    fetchedUrl: SAMPLE_URL,
    statusCode: 200,
    fetchMs: 42,
    sample: true,
    page: parsed,
    tech,
  });
}
