const DEFAULT_MAX_JSON_BYTES = 16_384;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBytes) {
    return { ok: false, error: "Request body too large" };
  }

  const raw = await request.text();
  if (raw.length > maxBytes) {
    return { ok: false, error: "Request body too large" };
  }

  if (!raw.trim()) {
    return { ok: false, error: "Empty request body" };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, error: "Invalid JSON body" };
  }
}
