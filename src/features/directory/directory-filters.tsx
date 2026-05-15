"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PROFESSIONS, QUALIFICATION_LEVELS } from "@/lib/constants";

interface DirectoryFiltersProps {
  locale: string;
  /** Merged, de-duplicated, sorted list of city options. */
  cities: string[];
  /** Distinct house-area options from the directory. */
  houseAreas: string[];
}

type FilterKey =
  | "q"
  | "profession"
  | "city"
  | "houseArea"
  | "qualificationLevel";

export function DirectoryFilters({
  locale,
  cities,
  houseAreas,
}: DirectoryFiltersProps) {
  const t = useTranslations("directory");
  const tCommon = useTranslations("common");
  const tProf = useTranslations("options.profession");
  const tQual = useTranslations("options.qualification");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelId = useId();

  const current = useCallback(
    (key: FilterKey) => searchParams.get(key) ?? "",
    [searchParams],
  );

  const [search, setSearch] = useState(() => current("q"));
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the text input in sync if the URL changes externally (e.g. Clear all).
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      // Any filter change resets pagination.
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const setParam = useCallback(
    (key: FilterKey, value: string) => {
      pushParams((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
    },
    [pushParams],
  );

  // Debounced search push (~350ms).
  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setParam("q", value.trim());
      }, 350);
    },
    [setParam],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasActiveFilters =
    Boolean(current("q")) ||
    Boolean(current("profession")) ||
    Boolean(current("city")) ||
    Boolean(current("houseArea")) ||
    Boolean(current("qualificationLevel"));

  const clearAll = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    router.push(pathname);
  }, [router, pathname]);

  const allLabel = tCommon("all");

  return (
    <div className="card-paper p-4 sm:p-5">
      {/* Search + mobile toggle row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor={`${panelId}-q`}>{tCommon("search")}</Label>
          <div className="relative">
            <Input
              id={`${panelId}-q`}
              type="search"
              inputMode="search"
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="pe-9"
              aria-label={t("searchPlaceholder")}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={tCommon("clear")}
                className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile-only filter toggle */}
        <Button
          type="button"
          variant="outline"
          className="lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          {tCommon("filter")}
          {hasActiveFilters && (
            <span
              className="ms-1 inline-block size-2 rounded-full bg-secondary"
              aria-hidden="true"
            />
          )}
        </Button>
      </div>

      {/* Filter fields: collapsible on small screens, inline row on lg+ */}
      <div
        id={panelId}
        className={`${open ? "grid" : "hidden"} mt-4 gap-3 sm:grid-cols-2 lg:mt-4 lg:grid lg:grid-cols-4`}
      >
        <div>
          <Label htmlFor={`${panelId}-profession`}>
            {t("filterProfession")}
          </Label>
          <Select
            id={`${panelId}-profession`}
            value={current("profession")}
            onChange={(e) => setParam("profession", e.target.value)}
          >
            <option value="">{allLabel}</option>
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {tProf(p)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor={`${panelId}-city`}>{t("filterCity")}</Label>
          <Select
            id={`${panelId}-city`}
            value={current("city")}
            onChange={(e) => setParam("city", e.target.value)}
          >
            <option value="">{allLabel}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor={`${panelId}-houseArea`}>
            {t("filterHouseArea")}
          </Label>
          <Select
            id={`${panelId}-houseArea`}
            value={current("houseArea")}
            onChange={(e) => setParam("houseArea", e.target.value)}
          >
            <option value="">{allLabel}</option>
            {houseAreas.length === 0 && (
              <option value="" disabled>
                {locale === "ur" ? "کوئی نہیں" : "None yet"}
              </option>
            )}
            {houseAreas.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor={`${panelId}-qualificationLevel`}>
            {t("filterQualification")}
          </Label>
          <Select
            id={`${panelId}-qualificationLevel`}
            value={current("qualificationLevel")}
            onChange={(e) =>
              setParam("qualificationLevel", e.target.value)
            }
          >
            <option value="">{allLabel}</option>
            {QUALIFICATION_LEVELS.map((q) => (
              <option key={q} value={q}>
                {tQual(q)}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-secondary hover:text-terracotta-700"
            >
              <X className="size-4" />
              {tCommon("clearAll")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
