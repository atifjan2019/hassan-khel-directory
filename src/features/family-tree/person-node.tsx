"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/shared/avatar";
import { cn } from "@/lib/utils";
import { PROFESSIONS, type Profession } from "@/lib/constants";
import { NODE_WIDTH, type PersonNode as PersonNodeType } from "./layout";

/**
 * Compact, performant person card used as a custom React Flow node.
 * Pure-presentational + memoised so panning/zooming never re-renders the
 * whole forest on cheap Android hardware.
 */
function PersonNodeComponent({ id, data }: NodeProps<PersonNodeType>) {
  const t = useTranslations("options.profession");
  const isKnownProfession = (PROFESSIONS as readonly string[]).includes(
    data.profession,
  );
  const profession = isKnownProfession
    ? t(data.profession as Profession)
    : data.profession;

  return (
    <button
      type="button"
      onClick={() => data.onSelect(id)}
      style={{ width: NODE_WIDTH }}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-xl border bg-card px-3 py-3 text-center shadow-soft outline-none transition-[transform,box-shadow,opacity] duration-200",
        "border-cream-300 hover:border-forest-600/50 focus-visible:ring-2 focus-visible:ring-ring",
        data.highlighted &&
          "-translate-y-1 border-gold-500 ring-2 ring-gold-500 shadow-card",
        data.dimmed && "opacity-40",
      )}
      aria-pressed={data.highlighted}
    >
      {/* Father connects into the top; children flow out of the bottom. */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="!h-1.5 !w-1.5 !border-0 !bg-forest-600/40"
      />

      <Avatar
        src={data.photoUrl}
        alt={data.label}
        hidden={data.hidePhoto}
        size={44}
        rounded="full"
      />

      <span className="line-clamp-2 text-xs font-semibold leading-tight text-forest-700">
        {data.label}
      </span>

      <span className="line-clamp-1 text-[10px] text-muted-foreground">
        {profession}
      </span>

      {data.isDeceased && (
        <span className="rounded-full border border-gold-500/40 bg-cream-50 px-1.5 py-0.5 text-[9px] font-medium leading-none text-gold-600">
          Marhoom
        </span>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="!h-1.5 !w-1.5 !border-0 !bg-forest-600/40"
      />
    </button>
  );
}

export const PersonNode = memo(PersonNodeComponent);
PersonNode.displayName = "PersonNode";
