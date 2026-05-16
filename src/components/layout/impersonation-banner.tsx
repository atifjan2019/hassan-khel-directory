import { cookies } from "next/headers";
import { IMP_MARKER_COOKIE } from "@/features/admin/impersonation";
import { getSession } from "@/lib/auth";
import { ImpersonationExitButton } from "./impersonation-exit-button";

/**
 * Sticky banner shown on every page while an admin is impersonating a user.
 * When not impersonating this is just a cheap cookie check (no DB call).
 */
export async function ImpersonationBanner() {
  const cookieStore = await cookies();
  if (!cookieStore.get(IMP_MARKER_COOKIE)) return null;

  const { user } = await getSession();
  const who = user?.email ?? "this user";

  return (
    <div
      role="alert"
      className="sticky top-0 z-[200] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-sm text-amber-950"
    >
      <span>
        You are viewing the site as <strong>{who}</strong>. Your admin session
        is preserved.
      </span>
      <ImpersonationExitButton />
    </div>
  );
}
