export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
  return isPrivateIp(host);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number.parseInt(p, 10));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0]! << 24) | (nums[1]! << 16) | (nums[2]! << 8) | nums[3]!) >>> 0;
}

export function isPrivateIp(ip: string): boolean {
  const v4 = ipv4ToInt(ip);
  if (v4 !== null) {
    const a = (v4 >>> 24) & 255;
    const b = (v4 >>> 16) & 255;
    if (a === 0 || a === 10 || a === 127 || a === 255) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const h = ip.toLowerCase();
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  return false;
}

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

export function normalizeAuditUrl(input: string): URL {
  const raw = input.trim();
  if (!raw) {
    throw new UrlValidationError("Enter a website URL to start the audit.");
  }
  if (/\s/.test(raw) && !raw.includes("://")) {
    throw new UrlValidationError("The URL cannot contain spaces.");
  }
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new UrlValidationError(
      "That does not look like a valid URL. Try something like example.com",
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlValidationError("Only http and https websites can be audited.");
  }
  if (!parsed.hostname) {
    throw new UrlValidationError("The URL is missing a website name.");
  }
  if (parsed.username || parsed.password) {
    throw new UrlValidationError("URLs with usernames or passwords cannot be audited.");
  }
  if (isPrivateHostname(parsed.hostname)) {
    throw new UrlValidationError("That address cannot be audited.");
  }
  if (parsed.hostname.endsWith(".onion")) {
    throw new UrlValidationError("That address cannot be audited.");
  }
  return parsed;
}
