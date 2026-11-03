import type { ParsedPage } from "./types";

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&/gi, "&")
    .replace(/</gi, "<")
    .replace(/>/gi, ">")
    .replace(/"/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/'/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#(\d+);/g, (_, num: string) => {
      const code = Number.parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
}

function collapse(text: string): string {
  return decodeEntities(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
}

function getAttr(openTag: string, name: string): string | null {
  const re = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = openTag.match(re);
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "").trim();
}

function collectHeading(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const text = collapse(match[1] ?? "");
    if (text) out.push(text.slice(0, 240));
    if (out.length >= 40) break;
  }
  return out;
}

export function parseHtml(html: string): ParsedPage {
  const clean = stripNoise(html);

  const titleMatch = clean.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? collapse(titleMatch[1] ?? "") || null : null;

  let metaDescription: string | null = null;
  const metaRe = /<meta\b[^>]*>/gi;
  let metaMatch: RegExpExecArray | null;
  while ((metaMatch = metaRe.exec(clean)) !== null) {
    const tag = metaMatch[0];
    const name = (getAttr(tag, "name") ?? getAttr(tag, "property") ?? "").toLowerCase();
    if (name === "description" || name === "og:description") {
      const content = getAttr(tag, "content");
      if (content) {
        metaDescription = content;
        if (name === "description") break;
      }
    }
  }

  const htmlTag = clean.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const lang = getAttr(htmlTag, "lang");

  const baseTag = clean.match(/<base\b[^>]*>/i)?.[0] ?? "";
  const baseHref = getAttr(baseTag, "href");

  const images: ParsedPage["images"] = [];
  const imgRe = /<img\b[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRe.exec(clean)) !== null) {
    const tag = imgMatch[0];
    const src = getAttr(tag, "src") ?? getAttr(tag, "data-src") ?? "";
    const hasAltAttr = /\salt\s*=/i.test(tag);
    const alt = hasAltAttr ? (getAttr(tag, "alt") ?? "") : null;
    images.push({ src, alt, hasAltAttr });
    if (images.length >= 200) break;
  }

  const links: ParsedPage["links"] = [];
  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let aMatch: RegExpExecArray | null;
  while ((aMatch = aRe.exec(clean)) !== null) {
    const href = getAttr(`<a ${aMatch[1] ?? ""}>`, "href") ?? "";
    const text = collapse(aMatch[2] ?? "").slice(0, 120);
    links.push({ href, text });
    if (links.length >= 400) break;
  }

  return {
    title,
    metaDescription,
    lang,
    headings: {
      h1: collectHeading(clean, "h1"),
      h2: collectHeading(clean, "h2"),
      h3: collectHeading(clean, "h3"),
    },
    images,
    links,
    baseHref,
  };
}
