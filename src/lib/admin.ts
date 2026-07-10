import { isCronAuthorized } from "@/lib/security/auth";
import { jsonResponse } from "@/lib/security/api";

/** Guard admin drop APIs with the same bearer secret as availability cron. */
export function requireAdminAuthorization(request: Request): Response | null {
  if (!isCronAuthorized(request)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
