import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
  /^metadata$/i,
  /^::1$/,
  /^fc[0-9a-f]{0,2}:/i,
  /^fd[0-9a-f]{0,2}:/i,
  /^fe80:/i,
];

function parseIpv4(hostname: string): number[] | null {
  const parts = hostname.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return -1;
    }

    const value = Number(part);
    if (value < 0 || value > 255) {
      return -1;
    }

    return value;
  });

  if (octets.some((octet) => octet < 0)) {
    return null;
  }

  return octets;
}

/** Reject decimal / octal / shorthand IPv4 forms that bypass dotted-quad checks. */
function looksLikeNonCanonicalIpv4(hostname: string): boolean {
  if (/^\d+$/.test(hostname)) {
    return true;
  }

  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    return true;
  }

  // e.g. 127.1, 10.1 — incomplete dotted forms
  if (/^\d{1,3}(?:\.\d{1,3}){1,2}$/.test(hostname)) {
    return true;
  }

  // Octal-looking octets (leading zeros)
  if (/^0\d+(?:\.\d+){3}$/.test(hostname)) {
    return true;
  }

  return false;
}

function isPrivateIpv4(octets: number[]): boolean {
  const [first, second] = octets;

  if (first === 10) {
    return true;
  }

  if (first === 127) {
    return true;
  }

  if (first === 0) {
    return true;
  }

  if (first === 169 && second === 254) {
    return true;
  }

  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }

  if (first === 192 && second === 168) {
    return true;
  }

  if (first === 100 && second >= 64 && second <= 127) {
    return true;
  }

  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (normalized === "::1" || normalized === "::") {
    return true;
  }

  if (
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd")
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (:ffff:127.0.0.1 or ::ffff:7f00:1)
  const mappedDotted = normalized.match(/:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedDotted) {
    const octets = parseIpv4(mappedDotted[1]);
    return octets ? isPrivateIpv4(octets) : true;
  }

  const mappedHex = normalized.match(/:ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const low = Number.parseInt(mappedHex[2], 16);
    const octets = [
      (high >> 8) & 0xff,
      high & 0xff,
      (low >> 8) & 0xff,
      low & 0xff,
    ];
    return isPrivateIpv4(octets);
  }

  return false;
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (looksLikeNonCanonicalIpv4(normalized)) {
    return true;
  }

  const ipv4 = parseIpv4(normalized);
  if (ipv4) {
    return isPrivateIpv4(ipv4);
  }

  if (isIP(normalized) === 6 || normalized.includes(":")) {
    return isPrivateIpv6(normalized);
  }

  return false;
}

function isPrivateResolvedAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const octets = parseIpv4(address);
    return octets ? isPrivateIpv4(octets) : true;
  }

  if (family === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

export interface PublicUrlOptions {
  httpsOnly?: boolean;
}

export function isPublicHttpUrl(
  url: string,
  options: PublicUrlOptions = {},
): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    if (options.httpsOnly && parsed.protocol !== "https:") {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    if (isPrivateHostname(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Same as isPublicHttpUrl, then resolves DNS and rejects private/link-local results.
 * Use before any server-side outbound fetch.
 */
export async function assertPublicHttpUrl(
  url: string,
  options: PublicUrlOptions = {},
): Promise<boolean> {
  if (!isPublicHttpUrl(url, options)) {
    return false;
  }

  // Vitest has no reliable outbound DNS; keep the sync hostname checks there.
  if (process.env.VITEST === "true") {
    return true;
  }

  try {
    const { hostname } = new URL(url);
    const bare = hostname.replace(/^\[|\]$/g, "");

    if (isIP(bare)) {
      return !isPrivateResolvedAddress(bare);
    }

    const records = await lookup(bare, { all: true, verbatim: true });
    if (records.length === 0) {
      return false;
    }

    return records.every((record) => !isPrivateResolvedAddress(record.address));
  } catch {
    return false;
  }
}

export function getPublicUrlGuardOptions(): PublicUrlOptions {
  return {
    httpsOnly: process.env.NODE_ENV === "production",
  };
}
