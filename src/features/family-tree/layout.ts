/**
 * Pure, framework-agnostic tidy-tree layout for the patrilineal family forest.
 *
 * Each person is linked to a father via `father_profile_id`. People whose
 * father is null/unknown — or points outside the approved set — are treated
 * as root ancestors. The forest can hold many independent roots.
 *
 * The algorithm assigns every subtree a contiguous block of horizontal
 * "slots"; a parent is centred over the span of its children, leaves take a
 * single slot. Depth maps directly to the Y axis (top-down). This keeps the
 * layout deterministic and computed once per data set (memoised by callers),
 * so it stays cheap even on low-end Android devices.
 */

import type { Node, Edge } from "@xyflow/react";
import { displayName } from "@/lib/utils";

/** Row shape returned by `getFamilyTreeNodes()` (RPC `family_tree_nodes`). */
export interface FamilyTreeRow {
  id: string;
  full_name_en: string;
  full_name_ur: string | null;
  honorific: string | null;
  profession: string;
  photo_url: string | null;
  hide_photo: boolean;
  is_deceased: boolean;
  father_profile_id: string | null;
}

/** Data carried by every React Flow "person" node. */
export interface PersonNodeData extends Record<string, unknown> {
  fullNameEn: string;
  fullNameUr: string | null;
  honorific: string | null;
  profession: string;
  photoUrl: string | null;
  hidePhoto: boolean;
  isDeceased: boolean;
  /** Pre-resolved localized display name (with honorific). */
  label: string;
  /** Lowercased haystack for fast client-side search. */
  search: string;
  /** Set by the flow when a lineage is active. */
  highlighted: boolean;
  /** True when another lineage is active and this node is not part of it. */
  dimmed: boolean;
  /** Selection callback wired by the flow container. */
  onSelect: (id: string) => void;
}

export type PersonNode = Node<PersonNodeData, "person">;

/** Layout constants — kept here so node + flow stay visually in sync. */
export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 96;
const H_GAP = 28; // horizontal gap between sibling slots
const V_GAP = 64; // vertical gap between generations
const SLOT_W = NODE_WIDTH + H_GAP;
const ROW_H = NODE_HEIGHT + V_GAP;
const ROOT_GAP = SLOT_W; // breathing room between separate family roots

interface TreeNode {
  row: FamilyTreeRow;
  children: TreeNode[];
  depth: number;
  /** Slot index assigned during layout (fractional = centred parent). */
  slot: number;
}

/** Build the parent→children forest, defending against cycles and orphans. */
function buildForest(rows: FamilyTreeRow[]): {
  roots: TreeNode[];
  byId: Map<string, TreeNode>;
} {
  const byId = new Map<string, TreeNode>();
  for (const row of rows) {
    byId.set(row.id, { row, children: [], depth: 0, slot: 0 });
  }

  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const fatherId = node.row.father_profile_id;
    const parent = fatherId ? byId.get(fatherId) : undefined;
    // Missing/unknown father, or father not in the approved set → root.
    if (!parent || parent === node) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  // A cycle (a → b → … → a) would leave every member parented and unreachable
  // from any root. Detect and re-root the unreachable components defensively.
  const reachable = new Set<string>();
  const walk = (n: TreeNode, guard: Set<string>) => {
    if (guard.has(n.row.id)) return; // cycle guard
    guard.add(n.row.id);
    reachable.add(n.row.id);
    for (const c of n.children) walk(c, guard);
  };
  for (const r of roots) walk(r, new Set<string>());

  if (reachable.size < byId.size) {
    for (const node of byId.values()) {
      if (reachable.has(node.row.id)) continue;
      // Break the cycle: detach from its (cyclic) parent and treat as a root.
      const fatherId = node.row.father_profile_id;
      const parent = fatherId ? byId.get(fatherId) : undefined;
      if (parent) {
        parent.children = parent.children.filter((c) => c !== node);
      }
      roots.push(node);
      walk(node, new Set<string>());
    }
  }

  // Stable ordering: roots and siblings sorted by display name (en fallback).
  const cmp = (a: TreeNode, b: TreeNode) =>
    a.row.full_name_en.localeCompare(b.row.full_name_en);
  const sortRec = (n: TreeNode) => {
    n.children.sort(cmp);
    for (const c of n.children) sortRec(c);
  };
  roots.sort(cmp);
  for (const r of roots) sortRec(r);

  return { roots, byId };
}

/**
 * Assign slots with a single post-order pass: leaves consume the next free
 * slot; internal nodes are centred over their children's span.
 */
function assignSlots(roots: TreeNode[]): number {
  let cursor = 0;

  const place = (node: TreeNode, depth: number): void => {
    node.depth = depth;
    if (node.children.length === 0) {
      node.slot = cursor;
      cursor += 1;
      return;
    }
    for (const child of node.children) place(child, depth + 1);
    const first = node.children[0]!.slot;
    const last = node.children[node.children.length - 1]!.slot;
    node.slot = (first + last) / 2;
  };

  for (const root of roots) {
    const start = cursor;
    place(root, 0);
    // Guarantee a gap between independent family trees.
    if (cursor > start) cursor += ROOT_GAP / SLOT_W;
  }

  return cursor;
}

/**
 * Build React Flow `nodes` + `edges` from the raw query rows.
 * Pure and deterministic — safe to memoise on `rawNodes` identity.
 */
export function buildTree(
  rows: FamilyTreeRow[],
  locale: string,
): { nodes: PersonNode[]; edges: Edge[] } {
  if (rows.length === 0) return { nodes: [], edges: [] };

  const { roots } = buildForest(rows);
  assignSlots(roots);

  const nodes: PersonNode[] = [];
  const edges: Edge[] = [];

  const emit = (node: TreeNode) => {
    const r = node.row;
    const label = displayName(locale, {
      honorific: r.honorific,
      full_name_en: r.full_name_en,
      full_name_ur: r.full_name_ur,
    });
    const search = [
      r.full_name_en,
      r.full_name_ur ?? "",
      r.honorific ?? "",
      label,
    ]
      .join(" ")
      .toLowerCase();

    nodes.push({
      id: r.id,
      type: "person",
      position: { x: node.slot * SLOT_W, y: node.depth * ROW_H },
      // A node never blocks pointer/zoom gestures of the canvas.
      draggable: false,
      selectable: true,
      data: {
        fullNameEn: r.full_name_en,
        fullNameUr: r.full_name_ur,
        honorific: r.honorific,
        profession: r.profession,
        photoUrl: r.photo_url,
        hidePhoto: r.hide_photo,
        isDeceased: r.is_deceased,
        label,
        search,
        highlighted: false,
        dimmed: false,
        onSelect: () => {},
      },
    });

    for (const child of node.children) {
      edges.push({
        id: `${r.id}->${child.row.id}`,
        source: r.id,
        target: child.row.id,
        type: "smoothstep",
      });
      emit(child);
    }
  };

  for (const root of roots) emit(root);

  return { nodes, edges };
}

/**
 * Return the id of `nodeId` plus every ancestor up the father chain — i.e.
 * the direct line back to the eldest known ancestor. Cycle-safe via a visited
 * set. `byId` maps every node id to its raw row.
 */
export function lineageIds(
  nodeId: string,
  byId: Map<string, FamilyTreeRow>,
): Set<string> {
  const ids = new Set<string>();
  let current: string | undefined = nodeId;
  while (current && byId.has(current) && !ids.has(current)) {
    ids.add(current);
    const fatherId: string | null =
      byId.get(current)?.father_profile_id ?? null;
    current = fatherId ?? undefined;
  }
  return ids;
}

/** Convenience: index rows by id for `lineageIds` / lookups. */
export function indexById(
  rows: FamilyTreeRow[],
): Map<string, FamilyTreeRow> {
  const m = new Map<string, FamilyTreeRow>();
  for (const r of rows) m.set(r.id, r);
  return m;
}
