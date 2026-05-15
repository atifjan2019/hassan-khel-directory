import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Next.js 16 proxy (formerly "middleware"):
 *  1) next-intl handles locale negotiation + rewrites/redirects
 *  2) Supabase refreshes the auth session cookie on the same response
 */
export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  return updateSession(request, response);
}

export const config = {
  // Skip Next internals, static assets and the OAuth callback.
  matcher: ["/((?!api|_next|_vercel|auth/callback|.*\\.[^/]+$).*)"],
};
