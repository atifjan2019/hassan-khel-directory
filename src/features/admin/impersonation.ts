/**
 * Shared constants for the admin "Login as user" impersonation flow.
 *
 * Impersonation overwrites the shared Supabase auth cookies with the target
 * user's session. To let the admin return to their own account we copy each
 * of the admin's auth cookies into a prefixed backup cookie and restore them
 * on exit. See getImpersonationLink / stopImpersonation in ./actions.
 *
 * Each cookie is backed up individually (NOT combined into one): the Supabase
 * session is already chunked because it exceeds the ~4 KB per-cookie limit, so
 * a single combined backup cookie would be silently dropped by the browser.
 */

/** Tiny marker cookie; its presence means an impersonation is active. */
export const IMP_MARKER_COOKIE = "imp_admin";

/** Prefix applied to each backed-up admin auth cookie. */
export const IMP_BACKUP_PREFIX = "imp_bak__";

/**
 * Matches @supabase/ssr auth cookies, including chunked variants
 * (e.g. `sb-abcd-auth-token`, `sb-abcd-auth-token.0`).
 */
export const SUPABASE_AUTH_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;

/** Upper bound (seconds) on how long an impersonation session may live. */
export const IMP_MAX_AGE = 60 * 60;
