"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/**
 * NProgress-style top loading bar. Gives immediate feedback that a click
 * registered and a page is loading, filling the gap between the click and
 * the destination rendering. No dependencies.
 *
 * - Enters "loading" when an internal link/button navigation click fires.
 * - Trickles toward ~90% while the next route is fetched.
 * - Enters "done" (fills + fades) once the pathname actually changes.
 */
export function TopProgressBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [width, setWidth] = useState(0);

  // Detect the start of an internal navigation from any clicked anchor.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      )
        return;

      const url = new URL(anchor.href, window.location.href);
      // External link, or same page → no route change to wait for.
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      setPhase("loading");
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // The new route has rendered — complete the bar.
  useEffect(() => {
    setPhase((p) => (p === "loading" ? "done" : p));
  }, [pathname]);

  // Drive the visual from the current phase.
  useEffect(() => {
    if (phase === "loading") {
      setWidth(8);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setWidth(90)),
      );
      // Never get stuck if a navigation is cancelled or fails.
      const safety = setTimeout(() => setPhase("done"), 10000);
      return () => clearTimeout(safety);
    }
    if (phase === "done") {
      setWidth(100);
      const reset = setTimeout(() => {
        setPhase("idle");
        setWidth(0);
      }, 280);
      return () => clearTimeout(reset);
    }
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
    >
      <div
        className="h-full bg-gradient-to-r from-forest-600 via-gold-400 to-terracotta-500 shadow-[0_0_8px] shadow-gold-400/60 transition-[width,opacity] ease-out"
        style={{
          width: `${width}%`,
          opacity: phase === "done" ? 0 : 1,
          transitionDuration:
            phase === "done" ? "200ms" : width >= 90 ? "8s" : "300ms",
        }}
      />
    </div>
  );
}
