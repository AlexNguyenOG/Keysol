import {
  assertPublicHttpUrl,
  getPublicUrlGuardOptions,
  type PublicUrlOptions,
} from "@/lib/security/url";

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_BYTES = 1_500_000;
const DEFAULT_MAX_REDIRECTS = 5;

export interface SafeFetchHtmlOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: HeadersInit;
  urlOptions?: PublicUrlOptions;
}

/**
 * Fetch HTML with SSRF guards: public URL check (incl. DNS), manual redirects,
 * per-hop revalidation, timeouts, and response size caps.
 */
export async function fetchPublicHtml(
  url: string,
  options: SafeFetchHtmlOptions = {},
): Promise<string | null> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const urlOptions = options.urlOptions ?? getPublicUrlGuardOptions();
  const headers = options.headers ?? {
    Accept: "text/html,application/xhtml+xml",
  };

  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    if (!(await assertPublicHttpUrl(currentUrl, urlOptions))) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers,
        redirect: "manual",
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return null;
        }

        currentUrl = new URL(location, currentUrl).href;
        continue;
      }

      if (!response.ok) {
        return null;
      }

      const buffer = await response.arrayBuffer();
      const slice =
        buffer.byteLength > maxBytes ? buffer.slice(0, maxBytes) : buffer;
      return new TextDecoder().decode(slice);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}
