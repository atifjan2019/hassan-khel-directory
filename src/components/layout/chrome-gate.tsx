"use client";

import { usePathname } from "next/navigation";

/**
 * Hides site chrome (header/footer) on admin routes, which have their own
 * full-screen layout. Wraps server components and renders nothing under
 * `/admin`. `usePathname` is available during SSR, so there is no flash.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
