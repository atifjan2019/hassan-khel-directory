"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { stopImpersonation } from "@/features/admin/actions";
import { Spinner } from "@/components/ui/spinner";

export function ImpersonationExitButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function onExit() {
    setError(false);
    startTransition(async () => {
      const res = await stopImpersonation();
      if (!res.ok) {
        setError(true);
        return;
      }
      // Full navigation so the restored admin cookies are sent and the
      // proxy re-validates the session.
      window.location.href = "/admin/members";
    });
  }

  return (
    <button
      type="button"
      onClick={onExit}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/15 px-2.5 py-1 font-semibold hover:bg-amber-950/25 disabled:opacity-60"
    >
      {pending ? <Spinner /> : <LogOut className="size-3.5" />}
      {error ? "Retry exit" : "Exit impersonation"}
    </button>
  );
}
