"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Pencil, Trash2, Power, KeyRound, LogIn } from "lucide-react";
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
import { setProfileStatus, deleteProfile, changeUserPassword, getImpersonationLink } from "./actions";

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

  // Change password dialog
  const [changePassTarget, setChangePassTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  // Impersonation dialog
  const [impersonateTarget, setImpersonateTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [impersonateBusy, setImpersonateBusy] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      [
        p.full_name_en,
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

  function onChangePassword() {
    if (!changePassTarget) return;
    setPassError(null);
    setPassSuccess(false);
    startTransition(async () => {
      const res = await changeUserPassword(changePassTarget.userId, newPassword);
      if (!res.ok) {
        setPassError(res.error ?? "Failed to change password");
        return;
      }
      setPassSuccess(true);
      setNewPassword("");
    });
  }

  function onImpersonate() {
    if (!impersonateTarget) return;
    setImpersonateError(null);
    setImpersonateBusy(true);
    startTransition(async () => {
      const res = await getImpersonationLink(impersonateTarget.userId);
      setImpersonateBusy(false);
      if (!res.ok || !res.url) {
        setImpersonateError(res.error ?? "Failed to generate login link");
        return;
      }
      setImpersonateTarget(null);
      window.open(res.url, "_blank", "noopener,noreferrer");
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
              <th className="px-4 py-3 text-start font-medium">Name</th>
              <th className="px-4 py-3 text-start font-medium">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                Profession
              </th>
              <th className="px-4 py-3 text-start font-medium">City</th>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        p.user_id
                          ? setChangePassTarget({
                              userId: p.user_id,
                              name: displayName(locale, p),
                            })
                          : null
                      }
                      disabled={!p.user_id}
                      title="Change password"
                      className="text-amber-600 hover:bg-amber-50"
                    >
                      <KeyRound className="size-4" />
                      <span className="sr-only">Change password</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        p.user_id
                          ? setImpersonateTarget({
                              userId: p.user_id,
                              name: displayName(locale, p),
                            })
                          : null
                      }
                      disabled={!p.user_id}
                      title="Login as this user"
                      className="text-sky-600 hover:bg-sky-50"
                    >
                      <LogIn className="size-4" />
                      <span className="sr-only">Login as user</span>
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        p.user_id
                          ? setChangePassTarget({
                              userId: p.user_id,
                              name: displayName(locale, p),
                            })
                          : null
                      }
                      disabled={!p.user_id}
                      className="text-amber-600 hover:bg-amber-50"
                    >
                      <KeyRound className="size-4" />
                      Change Password
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        p.user_id
                          ? setImpersonateTarget({
                              userId: p.user_id,
                              name: displayName(locale, p),
                            })
                          : null
                      }
                      disabled={!p.user_id}
                      className="text-sky-600 hover:bg-sky-50"
                    >
                      <LogIn className="size-4" />
                      Login As
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

      {/* Change Password Dialog */}
      <Dialog
        open={changePassTarget !== null}
        onClose={() => {
          setChangePassTarget(null);
          setNewPassword("");
          setPassError(null);
          setPassSuccess(false);
        }}
        labelledBy="chpass-title"
      >
        <h2
          id="chpass-title"
          className="font-display text-xl text-forest-700"
        >
          Change Password
        </h2>
        {changePassTarget && (
          <p className="mt-1 text-sm text-muted-foreground">
            for <strong>{changePassTarget.name}</strong>
          </p>
        )}
        {passError && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {passError}
          </p>
        )}
        {passSuccess && (
          <p
            role="status"
            className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
          >
            Password updated successfully.
          </p>
        )}
        <div className="mt-4 space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 characters)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500"
            autoComplete="new-password"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setChangePassTarget(null);
              setNewPassword("");
              setPassError(null);
              setPassSuccess(false);
            }}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onChangePassword}
            disabled={newPassword.length < 8}
          >
            <KeyRound className="size-4" />
            Set Password
          </Button>
        </div>
      </Dialog>

      {/* Login As User (Impersonation) Dialog */}
      <Dialog
        open={impersonateTarget !== null}
        onClose={() => {
          setImpersonateTarget(null);
          setImpersonateError(null);
        }}
        labelledBy="imp-title"
      >
        <h2 id="imp-title" className="font-display text-xl text-forest-700">
          Login as User
        </h2>
        {impersonateTarget && (
          <p className="mt-3 text-sm text-muted-foreground">
            A one-time link will open in a new tab and sign you in as{" "}
            <strong>{impersonateTarget.name}</strong>. A banner will appear at
            the top of the site while impersonating; click{" "}
            <strong>Exit impersonation</strong> there to return to your own
            admin account. Note: all tabs in this browser share the session.
          </p>
        )}
        {impersonateError && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {impersonateError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setImpersonateTarget(null);
              setImpersonateError(null);
            }}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={onImpersonate}
            disabled={impersonateBusy}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            {impersonateBusy ? <Spinner /> : <LogIn className="size-4" />}
            Login as User
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
