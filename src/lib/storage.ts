const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);

export function isValidMediaUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function normalizeMediaUrl(rawUrl: string | null | undefined): string | null {
  if (rawUrl === null || rawUrl === undefined) {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!isValidMediaUrl(trimmed)) {
    throw new Error("URL gambar harus berupa path relatif '/' atau URL http(s) yang valid.");
  }

  return trimmed;
}
