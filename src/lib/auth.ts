import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export interface SessionInfo {
  user: User | null;
  isAdmin: boolean;
}

/** Current user + admin flag (server-side, RLS-safe). */
export async function getSession(): Promise<SessionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: isAdmin } = await supabase.rpc("is_admin", { uid: user.id });
  return { user, isAdmin: Boolean(isAdmin) };
}

/**
 * Resolve where to send a user immediately after authenticating.
 *
 * An explicit deep-link `next` (anything other than the default `/profile`)
 * is always honored. Otherwise admins land on `/admin`, members on `/profile`.
 * Pass the same Supabase client that just established the session so the
 * freshly-set cookies are visible.
 */
export async function postLoginPath(
  supabase: SupabaseClient<Database>,
  next?: string | null,
): Promise<string> {
  if (next && next !== "/profile") return next;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/profile";
  const { data: isAdmin } = await supabase.rpc("is_admin", { uid: user.id });
  return isAdmin ? "/admin" : "/profile";
}

/** Guard an admin route. Redirects unauthorized users. */
export async function requireAdmin(
  _locale?: string,
): Promise<SessionInfo> {
  const session = await getSession();
  if (!session.user) redirect(`/login?next=/admin`);
  if (!session.isAdmin) redirect(`/?denied=1`);
  return session;
}

/** Guard a logged-in-only route. */
export async function requireUser(
  _locale?: string,
  next = "/profile",
): Promise<SessionInfo> {
  const session = await getSession();
  if (!session.user) redirect(`/login?next=${next}`);
  return session;
}
