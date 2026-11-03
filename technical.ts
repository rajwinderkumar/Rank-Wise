import { fetchResource } from "./fetch-page";
import type { TechnicalFiles } from "./types";

function originOf(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

function looksLikeRobots(body: string): boolean {
  return /^\s*(user-agent|sitemap|disallow|allow|crawl-delay)\s*:/im.test(body);
}

function looksLikeSitemap(body: string): boolean {
  return /<urlset|<sitemapindex|<\?xml/i.test(body);
}

export async function checkTechnicalFiles(pageUrl: string): Promise<TechnicalFiles> {
  const origin = originOf(pageUrl);
  const robotsUrl = `${origin}/robots.txt`;
  const sitemapCandidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];

  let robots: TechnicalFiles["robots"] = {
    found: false,
    status: null,
    sitemapUrls: [],
    snippet: null,
  };

  try {
    const res = await fetchResource(robotsUrl, { accept: "text/plain,*/*;q=0.8" });
    robots.status = res.status;
    if (res.ok && looksLikeRobots(res.body)) {
      const sitemapUrls: string[] = [];
      for (const line of res.body.split(/\r?\n/)) {
        const match = line.match(/^\s*sitemap\s*:\s*(\S+)/i);
        if (match?.[1]) sitemapUrls.push(match[1].trim());
      }
      robots = {
        found: true,
        status: res.status,
        sitemapUrls,
        snippet: res.body.slice(0, 400),
      };
      for (const extra of sitemapUrls) {
        if (!sitemapCandidates.includes(extra)) sitemapCandidates.push(extra);
      }
    }
  } catch {
    robots.status = null;
  }

  let sitemap: TechnicalFiles["sitemap"] = {
    found: false,
    status: null,
    url: null,
  };

  for (const candidate of sitemapCandidates.slice(0, 4)) {
    try {
      const res = await fetchResource(candidate, {
        accept: "application/xml,text/xml,*/*;q=0.8",
      });
      if (res.ok && looksLikeSitemap(res.body)) {
        sitemap = { found: true, status: res.status, url: res.url };
        break;
      }
      sitemap.status = res.status;
    } catch {
      /* try next */
    }
  }

  return { robots, sitemap };
}
