"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RotateCcw, X, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PersonNode } from "./person-node";
import {
  buildTree,
  indexById,
  lineageIds,
  NODE_HEIGHT,
  NODE_WIDTH,
  type FamilyTreeRow,
  type PersonNode as PersonNodeType,
} from "./layout";

const FOREST = "#1B4332";
const GOLD = "#C89B3C";
const CREAM_DOT = "#DCCDB2";

const nodeTypes = { person: PersonNode };

interface FamilyTreeFlowProps {
  rawNodes: FamilyTreeRow[];
  locale: string;
  initialFocusId?: string;
}

function FlowCanvas({
  rawNodes,
  locale,
  initialFocusId,
}: FamilyTreeFlowProps) {
  const t = useTranslations("familyTree");
  const isRtl = false;
  const { setCenter, fitView } = useReactFlow<PersonNodeType, Edge>();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Layout is pure + deterministic — compute once per data set.
  const base = useMemo(
    () => buildTree(rawNodes, locale),
    [rawNodes, locale],
  );
  const byId = useMemo(() => indexById(rawNodes), [rawNodes]);

  // The active lineage (the person + every ancestor up to the eldest).
  const lineage = useMemo(
    () => (selectedId ? lineageIds(selectedId, byId) : null),
    [selectedId, byId],
  );

  // Decorate nodes/edges from the immutable base — no re-layout on highlight.
  const nodes = useMemo<PersonNodeType[]>(() => {
    return base.nodes.map((n) => {
      const highlighted = lineage?.has(n.id) ?? false;
      const dimmed = lineage != null && !highlighted;
      return {
        ...n,
        data: {
          ...n.data,
          highlighted,
          dimmed,
          onSelect: (id: string) =>
            setSelectedId((prev) => (prev === id ? null : id)),
        },
      };
    });
  }, [base.nodes, lineage]);

  const edges = useMemo<Edge[]>(() => {
    return base.edges.map((e) => {
      const onLine =
        lineage != null &&
        lineage.has(e.source) &&
        lineage.has(e.target);
      const faded = lineage != null && !onLine;
      return {
        ...e,
        animated: onLine,
        style: {
          stroke: onLine ? GOLD : FOREST,
          strokeWidth: onLine ? 2.5 : 1.5,
          opacity: faded ? 0.18 : onLine ? 1 : 0.55,
        },
      };
    });
  }, [base.edges, lineage]);

  const centerOn = useCallback(
    (id: string) => {
      const target = base.nodes.find((n) => n.id === id);
      if (!target) return;
      setCenter(
        target.position.x + NODE_WIDTH / 2,
        target.position.y + NODE_HEIGHT / 2,
        { zoom: 1, duration: 600 },
      );
    },
    [base.nodes, setCenter],
  );

  // Honour ?focus=<id> from the profile page deep-link, once.
  const focusDone = useRef(false);
  useEffect(() => {
    if (focusDone.current) return;
    if (initialFocusId && byId.has(initialFocusId)) {
      focusDone.current = true;
      setSelectedId(initialFocusId);
      // Defer until the flow has measured itself.
      const tid = window.setTimeout(() => centerOn(initialFocusId), 250);
      return () => window.clearTimeout(tid);
    }
  }, [initialFocusId, byId, centerOn]);

  const handleNodeClick = useCallback<NodeMouseHandler<PersonNodeType>>(
    (_, node) => {
      setSelectedId((prev) => (prev === node.id ? null : node.id));
    },
    [],
  );

  const handleSearch = useCallback(
    (raw: string) => {
      setQuery(raw);
      const q = raw.trim().toLowerCase();
      if (!q) return;
      const match = base.nodes.find((n) => n.data.search.includes(q));
      if (match) {
        setSelectedId(match.id);
        centerOn(match.id);
      }
    },
    [base.nodes, centerOn],
  );

  const resetView = useCallback(() => {
    setSelectedId(null);
    setQuery("");
    fitView({ duration: 600, padding: 0.2 });
  }, [fitView]);

  return (
    <div
      className="relative h-[75dvh] min-h-[480px] w-full overflow-hidden rounded-xl border border-cream-300 bg-cream-50"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Toolbar — logical positioning so it mirrors correctly in RTL. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="pointer-events-auto relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="ltr:pl-9 rtl:pr-9"
          />
        </div>

        <div className="pointer-events-auto flex flex-wrap gap-2">
          {selectedId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedId(null);
                setQuery("");
              }}
              className="bg-card"
            >
              <X className="size-4" />
              {t("clearHighlight")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="bg-card"
          >
            <RotateCcw className="size-4" />
            {t("resetView")}
          </Button>
        </div>
      </div>

      {/* Hint band: highlight tip + mobile gesture instructions. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3">
        <p className="pointer-events-none rounded-full bg-card/85 px-3 py-1 text-center text-[11px] text-muted-foreground shadow-soft backdrop-blur-sm">
          <span className="sm:hidden">{t("instructionsMobile")}</span>
          <span className="hidden sm:inline">{t("highlightHint")}</span>
        </p>
      </div>

      <ReactFlow<PersonNodeType, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedId(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        panOnDrag
        panOnScroll={false}
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: false }}
        className={cn(
          "[&_.react-flow__attribution]:!bg-transparent",
          "[&_.react-flow__attribution]:!text-[10px]",
        )}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.2}
          color={CREAM_DOT}
        />
        <Controls
          showInteractive={false}
          className="!shadow-soft [&_button]:!border-cream-300 [&_button]:!bg-card [&_button]:!text-forest-700"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * Public entry — wraps the canvas in a React Flow provider so `useReactFlow`
 * (setCenter / fitView) works for the search + deep-link focus features.
 */
export default function FamilyTreeFlow(props: FamilyTreeFlowProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
