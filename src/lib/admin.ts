import { isAdminAuthorized } from "@/lib/security/auth";
import { jsonResponse } from "@/lib/security/api";

/** Guard admin drop APIs with ADMIN_API_SECRET (falls back to cron secret). */
export function requireAdminAuthorization(request: Request): Response | null {
  if (!isAdminAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
