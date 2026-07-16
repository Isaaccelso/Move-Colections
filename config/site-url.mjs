export function normalizeSiteUrl(value) {
  if (!value) return null;

  let candidate = String(value).trim();
  candidate = candidate.replace(/^SITE_URL\s*=\s*/i, "").trim();
  candidate = candidate.replace(/^['"]|['"]$/g, "").trim();
  if (!candidate) return null;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(environment = process.env) {
  return (
    normalizeSiteUrl(environment.SITE_URL) ??
    normalizeSiteUrl(environment.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(environment.VERCEL_URL) ??
    "http://localhost:4321"
  );
}
