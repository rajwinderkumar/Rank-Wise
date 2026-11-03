export type CheckStatus = "pass" | "warning" | "error";

export type CheckCategory = "on-page" | "structure" | "technical";

export type SeoCheckItem = {
  label: string;
  value: string;
  ok?: boolean;
};

export type SeoCheck = {
  id: string;
  title: string;
  category: CheckCategory;
  status: CheckStatus;
  score: number;
  maxScore: number;
  summary: string;
  why: string;
  recommendation?: string;
  items?: SeoCheckItem[];
};

export type Recommendation = {
  title: string;
  body: string;
  checkId: string;
  priority: CheckStatus;
};

export type PageSnapshot = {
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  missingAltCount: number;
  internalLinks: number;
  externalLinks: number;
  robotsFound: boolean;
  sitemapFound: boolean;
};

export type AuditGrade = "Excellent" | "Good" | "Needs work" | "Poor";

export type AuditResult = {
  id: string;
  url: string;
  normalizedUrl: string;
  fetchedUrl: string;
  statusCode: number;
  fetchMs: number;
  analyzedAt: string;
  sample: boolean;
  score: number;
  grade: AuditGrade;
  status: CheckStatus;
  passed: number;
  warnings: number;
  errors: number;
  checks: SeoCheck[];
  recommendations: Recommendation[];
  page: PageSnapshot;
};

export type AuditSummary = {
  id: string;
  url: string;
  score: number;
  status: string;
  createdAt: string;
};

export type ParsedPage = {
  title: string | null;
  metaDescription: string | null;
  lang: string | null;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  images: Array<{ src: string; alt: string | null; hasAltAttr: boolean }>;
  links: Array<{ href: string; text: string }>;
  baseHref: string | null;
};

export type TechnicalFiles = {
  robots: {
    found: boolean;
    status: number | null;
    sitemapUrls: string[];
    snippet: string | null;
  };
  sitemap: {
    found: boolean;
    status: number | null;
    url: string | null;
  };
};
