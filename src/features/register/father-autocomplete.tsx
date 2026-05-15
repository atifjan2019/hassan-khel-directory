"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FatherOption {
  id: string;
  label: string;
}

interface FatherAutocompleteProps {
  locale: string;
  /** Currently linked father profile id (or undefined). */
  value?: string;
  /** Current father_name_en value, used to seed the input & decide auto-fill. */
  currentFatherName?: string;
  /** Called when a father is linked / unlinked. */
  onSelect: (
    fatherProfileId: string | undefined,
    fatherLabel?: string,
  ) => void;
}

export function FatherAutocomplete({
  locale,
  value,
  currentFatherName,
  onSelect,
}: FatherAutocompleteProps) {
  const t = useTranslations("register");
  const listboxId = useId();
  const supabase = useRef(createClient());

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<FatherOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [linkedLabel, setLinkedLabel] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search against the public RPC.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.current.rpc(
        "search_potential_fathers",
        { q },
      );
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setOptions([]);
        return;
      }
      setOptions((data ?? []) as FatherOption[]);
      setOpen(true);
      setActiveIndex(-1);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(opt: FatherOption) {
    setLinkedLabel(opt.label);
    setQuery("");
    setOptions([]);
    setOpen(false);
    setActiveIndex(-1);
    // Auto-fill father_name_en only if it is currently empty.
    const fill =
      !currentFatherName || currentFatherName.trim().length === 0
        ? opt.label
        : undefined;
    onSelect(opt.id, fill);
  }

  function clearLink() {
    setLinkedLabel(null);
    setQuery("");
    setOptions([]);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(undefined);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open && options.length > 0) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < options.length) {
        e.preventDefault();
        choose(options[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor={`${listboxId}-input`}>{t("linkFather")}</Label>
      <p className="-mt-1 mb-2 text-xs text-muted-foreground">
        {t("linkFatherHint")}
      </p>

      {value && linkedLabel ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Check className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate font-medium">{linkedLabel}</span>
          </span>
          <button
            type="button"
            onClick={clearLink}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            {t("linkFatherNone")}
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id={`${listboxId}-input`}
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0
                  ? `${listboxId}-opt-${activeIndex}`
                  : undefined
              }
              autoComplete="off"
              className="ps-9"
              placeholder={t("linkFatherSearch")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => options.length > 0 && setOpen(true)}
              onKeyDown={onKeyDown}
            />
          </div>

          {open && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t("linkFather")}
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-card"
            >
              <li
                role="option"
                aria-selected={false}
                tabIndex={-1}
                onClick={clearLink}
                className="cursor-pointer px-3 py-3 text-sm text-muted-foreground hover:bg-primary/5"
              >
                {t("linkFatherNone")}
              </li>

              {loading && (
                <li
                  className="px-3 py-3 text-sm text-muted-foreground"
                  aria-disabled="true"
                >
                  Searching…
                </li>
              )}

              {!loading &&
                options.map((opt, i) => (
                  <li
                    key={opt.id}
                    id={`${listboxId}-opt-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(opt)}
                    className={cn(
                      "cursor-pointer px-3 py-3 text-sm",
                      i === activeIndex
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-primary/5",
                    )}
                  >
                    {opt.label}
                  </li>
                ))}

              {!loading &&
                options.length === 0 &&
                query.trim().length >= 2 && (
                  <li
                    className="px-3 py-3 text-sm text-muted-foreground"
                    aria-disabled="true"
                  >
                    No matching member found
                  </li>
                )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
