import type {
  ParsedPage,
  SeoCheck,
  TechnicalFiles,
} from "./types";

function resolveHref(href: string, pageUrl: string, baseHref: string | null): URL | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("data:") ||
    trimmed.startsWith("#")
  ) {
    return null;
  }
  try {
    const base = baseHref ? new URL(baseHref, pageUrl) : pageUrl;
    return new URL(trimmed, base);
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function checkTitle(page: ParsedPage): SeoCheck {
  const title = page.title;
  const why =
    "The title is the clickable headline in search results. It should name the page clearly.";
  if (!title) {
    return {
      id: "title",
      title: "Page title",
      category: "on-page",
      status: "error",
      score: 0,
      maxScore: 15,
      summary: "No title tag was found.",
      why,
      recommendation:
        "Add a unique <title> between 30 and 60 characters that describes the page topic.",
    };
  }
  const length = title.length;
  if (length < 30) {
    return {
      id: "title",
      title: "Page title",
      category: "on-page",
      status: "warning",
      score: 9,
      maxScore: 15,
      summary: `Title is short (${length} characters).`,
      why,
      recommendation:
        "Lengthen the title so it clearly describes the page. Aim for 30–60 characters.",
      items: [{ label: "Title", value: title }, { label: "Length", value: `${length} characters` }],
    };
  }
  if (length > 60) {
    return {
      id: "title",
      title: "Page title",
      category: "on-page",
      status: "warning",
      score: length > 70 ? 8 : 11,
      maxScore: 15,
      summary: `Title is long (${length} characters). Search results may cut it off.`,
      why,
      recommendation: "Shorten the title to about 50–60 characters so it fits in search results.",
      items: [{ label: "Title", value: title }, { label: "Length", value: `${length} characters` }],
    };
  }
  return {
    id: "title",
    title: "Page title",
    category: "on-page",
    status: "pass",
    score: 15,
    maxScore: 15,
    summary: `Title looks well sized (${length} characters).`,
    why,
    items: [{ label: "Title", value: title }, { label: "Length", value: `${length} characters` }],
  };
}

export function checkMeta(page: ParsedPage): SeoCheck {
  const desc = page.metaDescription;
  const why =
    "The meta description is the short summary under the title in search results. It helps people decide whether to click.";
  if (!desc) {
    return {
      id: "meta",
      title: "Meta description",
      category: "on-page",
      status: "error",
      score: 0,
      maxScore: 15,
      summary: "No meta description was found.",
      why,
      recommendation:
        "Add a meta description of about 70–160 characters that explains what the page offers.",
    };
  }
  const length = desc.length;
  if (length < 70) {
    return {
      id: "meta",
      title: "Meta description",
      category: "on-page",
      status: "warning",
      score: 9,
      maxScore: 15,
      summary: `Description is short (${length} characters).`,
      why,
      recommendation: "Write a fuller description so search users understand the page at a glance.",
      items: [{ label: "Description", value: desc }, { label: "Length", value: `${length} characters` }],
    };
  }
  if (length > 160) {
    return {
      id: "meta",
      title: "Meta description",
      category: "on-page",
      status: "warning",
      score: length > 180 ? 8 : 11,
      maxScore: 15,
      summary: `Description is long (${length} characters) and may be trimmed.`,
      why,
      recommendation: "Keep the meta description around 150–160 characters.",
      items: [{ label: "Description", value: desc }, { label: "Length", value: `${length} characters` }],
    };
  }
  return {
    id: "meta",
    title: "Meta description",
    category: "on-page",
    status: "pass",
    score: 15,
    maxScore: 15,
    summary: `Description looks well sized (${length} characters).`,
    why,
    items: [{ label: "Description", value: desc }, { label: "Length", value: `${length} characters` }],
  };
}

export function checkHeadings(page: ParsedPage): SeoCheck {
  const { h1, h2, h3 } = page.headings;
  const why =
    "Headings organise the page. One H1 should name the main topic. H2 and H3 should follow in a sensible order.";
  const items = [
    { label: "H1 headings", value: String(h1.length), ok: h1.length === 1 },
    { label: "H2 headings", value: String(h2.length), ok: h2.length > 0 },
    { label: "H3 headings", value: String(h3.length) },
  ];
  if (h1.length > 0) {
    items.push({ label: "Main H1", value: h1[0] ?? "" });
  }
  if (h1.length === 0) {
    return {
      id: "headings",
      title: "Heading structure",
      category: "on-page",
      status: "error",
      score: 0,
      maxScore: 15,
      summary: "No H1 heading was found.",
      why,
      recommendation: "Add one H1 that states the main topic of the page.",
      items,
    };
  }
  let score = 8;
  let status: SeoCheck["status"] = "pass";
  const notes: string[] = [];
  if (h1.length === 1) {
    score += 0;
    notes.push("One H1 is present.");
  } else {
    score -= 3;
    status = "warning";
    notes.push(`${h1.length} H1 headings were found. One is usually enough.`);
  }
  if (h2.length > 0) {
    score += 4;
    notes.push("H2 headings are present.");
  } else {
    status = "warning";
    notes.push("No H2 headings were found.");
  }
  if (h3.length > 0 && h2.length === 0) {
    score += 0;
    status = "warning";
    notes.push("H3 headings appear without H2 headings.");
  } else {
    score += 3;
  }
  score = Math.max(4, Math.min(15, score));
  if (h1.length !== 1 || h2.length === 0) status = "warning";
  return {
    id: "headings",
    title: "Heading structure",
    category: "on-page",
    status,
    score,
    maxScore: 15,
    summary: notes[0] ?? "Heading structure reviewed.",
    why,
    recommendation:
      status === "pass"
        ? undefined
        : "Use a single H1, then H2 sections, then H3 subsections. Avoid skipping levels.",
    items,
  };
}

export function checkImages(page: ParsedPage): SeoCheck {
  const why =
    "Alternative text describes images for screen readers and helps search engines understand pictures.";
  const images = page.images;
  if (images.length === 0) {
    return {
      id: "images",
      title: "Image alt text",
      category: "on-page",
      status: "pass",
      score: 15,
      maxScore: 15,
      summary: "No images were found on this page.",
      why,
    };
  }
  const missing = images.filter((img) => !img.hasAltAttr);
  const empty = images.filter((img) => img.hasAltAttr && !(img.alt ?? "").trim());
  const okCount = images.length - missing.length - empty.length;
  const items = missing.slice(0, 8).map((img) => ({
    label: "Missing alt",
    value: img.src || "(no src)",
    ok: false,
  }));
  if (missing.length === 0 && empty.length === 0) {
    return {
      id: "images",
      title: "Image alt text",
      category: "on-page",
      status: "pass",
      score: 15,
      maxScore: 15,
      summary: `All ${images.length} images include alternative text.`,
      why,
    };
  }
  if (missing.length === images.length) {
    return {
      id: "images",
      title: "Image alt text",
      category: "on-page",
      status: "error",
      score: 0,
      maxScore: 15,
      summary: `None of the ${images.length} images have alt text.`,
      why,
      recommendation: "Add a short, useful alt attribute to every meaningful image.",
      items,
    };
  }
  const ratio = okCount / images.length;
  return {
    id: "images",
    title: "Image alt text",
    category: "on-page",
    status: "warning",
    score: Math.max(4, Math.round(15 * ratio)),
    maxScore: 15,
    summary: `${missing.length + empty.length} of ${images.length} images need better alt text.`,
    why,
    recommendation:
      "Add descriptive alt text to images that convey information. Decorative images can use empty alt=\"\".",
    items,
  };
}

export function checkLinks(page: ParsedPage, pageUrl: string): SeoCheck {
  const why =
    "Links connect pages. Internal links help people and search engines move around the site. External links can support related sources.";
  const pageHost = hostOf(pageUrl);
  let internal = 0;
  let external = 0;
  let empty = 0;
  const samples: SeoCheck["items"] = [];
  for (const link of page.links) {
    if (!link.href.trim() || link.href.trim() === "#") {
      empty += 1;
      continue;
    }
    const resolved = resolveHref(link.href, pageUrl, page.baseHref);
    if (!resolved) continue;
    const kind = hostOf(resolved.toString()) === pageHost ? "internal" : "external";
    if (kind === "internal") internal += 1;
    else external += 1;
    if (samples.length < 6) {
      samples.push({
        label: kind === "internal" ? "Internal" : "External",
        value: resolved.toString().slice(0, 180),
      });
    }
  }
  const items = [
    { label: "Internal links", value: String(internal) },
    { label: "External links", value: String(external) },
    { label: "Empty or # links", value: String(empty), ok: empty === 0 },
    ...(samples ?? []),
  ];
  if (internal + external === 0) {
    return {
      id: "links",
      title: "Internal and external links",
      category: "structure",
      status: "warning",
      score: 4,
      maxScore: 10,
      summary: "No crawlable links were found on the page.",
      why,
      recommendation: "Add useful internal links so visitors can reach other pages on the site.",
      items,
    };
  }
  let score = 0;
  if (internal > 0) score += 5;
  if (external > 0) score += 3;
  if (empty === 0) score += 2;
  else score += 1;
  const status: SeoCheck["status"] =
    internal === 0 || empty > 0 ? "warning" : "pass";
  return {
    id: "links",
    title: "Internal and external links",
    category: "structure",
    status,
    score,
    maxScore: 10,
    summary: `${internal} internal and ${external} external links were found.`,
    why,
    recommendation:
      status === "pass"
        ? undefined
        : "Add a few clear internal links, and avoid empty or # only href values.",
    items,
  };
}

export function checkUrlStructure(pageUrl: string): SeoCheck {
  const why =
    "A clean HTTPS URL is easier to share, trust, and understand. Search engines also prefer secure pages.";
  const url = new URL(pageUrl);
  const items: NonNullable<SeoCheck["items"]> = [
    { label: "Protocol", value: url.protocol.replace(":", ""), ok: url.protocol === "https:" },
    { label: "Host", value: url.hostname },
    { label: "Path", value: url.pathname || "/" },
  ];
  let score = 0;
  const notes: string[] = [];
  let status: SeoCheck["status"] = "pass";
  if (url.protocol === "https:") {
    score += 5;
    notes.push("The page is served over HTTPS.");
  } else {
    status = "error";
    notes.push("The page is not using HTTPS.");
  }
  const path = url.pathname;
  const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname);
  const hasUnderscore = path.includes("_");
  const tooLong = path.length > 80;
  const mixedCase = /[A-Z]/.test(path);
  const deep = path.split("/").filter(Boolean).length > 5;
  if (!isIp && !hasUnderscore && !tooLong && !mixedCase && !deep) {
    score += 5;
    notes.push("The URL path looks tidy.");
  } else {
    score += 2;
    status = status === "error" ? "error" : "warning";
    if (isIp) notes.push("The host looks like an IP address rather than a domain name.");
    if (hasUnderscore) notes.push("The path uses underscores. Hyphens are usually easier to read.");
    if (tooLong) notes.push("The path is quite long.");
    if (mixedCase) notes.push("The path includes capital letters.");
    if (deep) notes.push("The path is nested quite deeply.");
  }
  return {
    id: "url",
    title: "URL structure",
    category: "structure",
    status,
    score,
    maxScore: 10,
    summary: notes[0] ?? "URL structure reviewed.",
    why,
    recommendation:
      status === "pass"
        ? undefined
        : "Prefer HTTPS, a real domain name, and a short lowercase path with hyphens.",
    items,
  };
}

export function checkRobots(tech: TechnicalFiles): SeoCheck {
  const why =
    "robots.txt tells search engines which parts of the site they may crawl. It is a basic technical file at the site root.";
  if (tech.robots.found) {
    const items = [
      { label: "Location", value: "/robots.txt", ok: true },
      {
        label: "Sitemaps listed",
        value: String(tech.robots.sitemapUrls.length),
      },
    ];
    if (tech.robots.snippet) {
      items.push({ label: "Preview", value: tech.robots.snippet.slice(0, 220) });
    }
    return {
      id: "robots",
      title: "robots.txt",
      category: "technical",
      status: "pass",
      score: 10,
      maxScore: 10,
      summary: "robots.txt is available at the site root.",
      why,
      items,
    };
  }
  return {
    id: "robots",
    title: "robots.txt",
    category: "technical",
    status: "error",
    score: 0,
    maxScore: 10,
    summary: "robots.txt was not found at the expected location.",
    why,
    recommendation: "Add a robots.txt file at https://your-domain/robots.txt.",
  };
}

export function checkSitemap(tech: TechnicalFiles): SeoCheck {
  const why =
    "A sitemap lists important pages so search engines can discover them more easily.";
  if (tech.sitemap.found) {
    return {
      id: "sitemap",
      title: "sitemap.xml",
      category: "technical",
      status: "pass",
      score: 10,
      maxScore: 10,
      summary: "A sitemap file was found.",
      why,
      items: [{ label: "Location", value: tech.sitemap.url ?? "/sitemap.xml", ok: true }],
    };
  }
  if (tech.robots.sitemapUrls.length > 0) {
    return {
      id: "sitemap",
      title: "sitemap.xml",
      category: "technical",
      status: "warning",
      score: 6,
      maxScore: 10,
      summary: "robots.txt lists a sitemap, but the usual sitemap.xml URL did not respond.",
      why,
      recommendation: "Confirm the sitemap URL in robots.txt is reachable.",
      items: tech.robots.sitemapUrls.slice(0, 3).map((u) => ({
        label: "Listed sitemap",
        value: u,
      })),
    };
  }
  return {
    id: "sitemap",
    title: "sitemap.xml",
    category: "technical",
    status: "error",
    score: 0,
    maxScore: 10,
    summary: "sitemap.xml was not found at the expected location.",
    why,
    recommendation: "Publish a sitemap.xml file at the site root, and mention it in robots.txt.",
  };
}
