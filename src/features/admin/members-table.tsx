"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Pencil, Trash2, Power } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { displayName } from "@/lib/utils";
import type { ProfileRow, ProfileStatus } from "@/lib/database.types";
import { setProfileStatus, deleteProfile } from "./actions";

const STATUS_VARIANT: Record<
  ProfileStatus,
  "success" | "warning" | "destructive" | "secondary"
> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
  disabled: "secondary",
};

export function MembersTable({
  profiles,
  locale,
}: {
  profiles: ProfileRow[];
  locale: string;
}) {
  const t = useTranslations("admin.members");
  const tStatus = useTranslations("options.status");
  const tProf = useTranslations("options.profession");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      [
        p.full_name_en,
        p.full_name_ur,
        p.father_name_en,
        p.current_city,
        p.profession,
        p.phone,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [profiles, query]);

  function toggleStatus(p: ProfileRow) {
    setError(null);
    setBusyId(p.id);
    const next: ProfileStatus =
      p.status === "approved" ? "disabled" : "approved";
    startTransition(async () => {
      const res = await setProfileStatus(p.id, next);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await deleteProfile(id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} / {profiles.length}
      </p>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-start">
            <tr>
              <th className="px-4 py-3 text-start font-medium">
                {locale === "ur" ? "نام" : "Name"}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {locale === "ur" ? "پیشہ" : "Profession"}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {locale === "ur" ? "شہر" : "City"}
              </th>
              <th className="px-4 py-3 text-end font-medium">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={p.photo_url}
                      alt={p.full_name_en}
                      hidden={p.hide_photo}
                      size={36}
                    />
                    <span className="font-medium">
                      {displayName(locale, p)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[p.status]}>
                    {tStatus(p.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {tProf(p.profession)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.current_city ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/members/${p.id}/edit`}>
                        <Pencil className="size-4" />
                        <span className="sr-only">{t("editProfile")}</span>
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleStatus(p)}
                      disabled={busyId === p.id}
                      title={
                        p.status === "approved"
                          ? t("disable")
                          : t("enable")
                      }
                    >
                      {busyId === p.id ? (
                        <Spinner />
                      ) : (
                        <Power className="size-4" />
                      )}
                      <span className="sr-only">
                        {p.status === "approved"
                          ? t("disable")
                          : t("enable")}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(p.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">{t("delete")}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="grid gap-3 md:hidden">
        {filtered.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <Avatar
                  src={p.photo_url}
                  alt={p.full_name_en}
                  hidden={p.hide_photo}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {displayName(locale, p)}
                    </span>
                    <Badge variant={STATUS_VARIANT[p.status]}>
                      {tStatus(p.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tProf(p.profession)}
                    {p.current_city ? ` · ${p.current_city}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/members/${p.id}/edit`}>
                        <Pencil className="size-4" />
                        {t("editProfile")}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleStatus(p)}
                      disabled={busyId === p.id}
                    >
                      <Power className="size-4" />
                      {p.status === "approved"
                        ? t("disable")
                        : t("enable")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(p.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        labelledBy="del-title"
      >
        <h2 id="del-title" className="font-display text-xl text-forest-700">
          {t("delete")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("deleteConfirm")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteId(null)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={busyId === deleteId && deleteId !== null}
          >
            {busyId === deleteId && deleteId !== null ? (
              <Spinner className="text-destructive-foreground" />
            ) : null}
            {tCommon("delete")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
