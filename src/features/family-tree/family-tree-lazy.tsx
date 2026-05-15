"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import type { FamilyTreeRow } from "./layout";

/**
 * Client boundary that lazy-loads React Flow. `ssr: false` keeps the heavy
 * graph library (and its `window`-dependent measuring) out of the server
 * render and first paint; the page itself stays a Server Component.
 */
const FamilyTreeFlow = dynamic(() => import("./family-tree-flow"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[75dvh] min-h-[480px] w-full items-center justify-center rounded-xl border border-cream-300 bg-cream-50"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-7" />
    </div>
  ),
});

export interface FamilyTreeLazyProps {
  rawNodes: FamilyTreeRow[];
  locale: string;
  initialFocusId?: string;
}

export function FamilyTreeLazy(props: FamilyTreeLazyProps) {
  return <FamilyTreeFlow {...props} />;
}
