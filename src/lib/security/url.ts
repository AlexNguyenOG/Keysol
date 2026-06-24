const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
  /^metadata$/i,
  /^::1$/,
  /^fc00:/i,
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

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const ipv4 = parseIpv4(normalized);
  if (ipv4) {
    return isPrivateIpv4(ipv4);
  }

  return false;
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

export function getPublicUrlGuardOptions(): PublicUrlOptions {
  return {
    httpsOnly: process.env.NODE_ENV === "production",
  };
}
