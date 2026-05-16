import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth";

/**
 * Token-hash confirmation endpoint for links minted server-side via
 * `admin.generateLink` (e.g. the admin "Login as user" impersonation).
 *
 * Unlike /auth/callback (which expects a PKCE `?code=` and a code-verifier
 * cookie set by the browser that started the flow), this verifies the OTP
 * token hash directly with `verifyOtp`, which establishes the SSR session
 * cookies even though no browser initiated the flow.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/profile";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const dest = await postLoginPath(supabase, next);
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
