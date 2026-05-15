"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { displayName, localized, formatDate } from "@/lib/utils";
import type { ProfileRow } from "@/lib/database.types";
import { approveProfile, rejectProfile } from "./actions";

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function PendingList({
  profiles,
  locale,
}: {
  profiles: ProfileRow[];
  locale: string;
}) {
  const t = useTranslations("admin.pending");
  const tProf = useTranslations("options.profession");
  const tQual = useTranslations("options.qualification");
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onApprove(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = await approveProfile(id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      router.refresh();
    });
  }

  function onConfirmReject() {
    if (!rejectId) return;
    setError(null);
    const id = rejectId;
    setBusyId(id);
    startTransition(async () => {
      const res = await rejectProfile(id, reason);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setRejectId(null);
      setReason("");
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

      <ul className="grid gap-4">
        {profiles.map((p) => {
          const open = expanded === p.id;
          const busy = busyId === p.id;
          return (
            <li key={p.id}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Avatar
                      src={p.photo_url}
                      alt={p.full_name_en}
                      hidden={p.hide_photo}
                      size={64}
                      rounded="lg"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg text-forest-700">
                          {displayName(locale, p)}
                        </h3>
                        <Badge variant="warning">
                          {formatDate(p.created_at, locale)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tProfile("father")}:{" "}
                        {localized(locale, p.father_name_en)}
                        {p.grandfather_name_en
                          ? ` · ${localized(locale, p.grandfather_name_en)}`
                          : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tProf(p.profession)} ·{" "}
                        <span className="text-foreground">
                          {t("submittedOn")}{" "}
                          {formatDate(p.created_at, locale)}
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(open ? null : p.id)
                        }
                        aria-expanded={open}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        {t("viewDetails")}
                        <ChevronDown
                          className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>

                      {open && (
                        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-muted/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          <Detail
                            label={tProfile("dateOfBirth")}
                            value={
                              p.date_of_birth
                                ? formatDate(p.date_of_birth, locale)
                                : null
                            }
                          />
                          <Detail
                            label={tProfile("qualification")}
                            value={
                              p.qualification_level
                                ? tQual(p.qualification_level)
                                : p.qualification
                            }
                          />
                          <Detail
                            label={tProfile("institute")}
                            value={p.institute}
                          />
                          <Detail
                            label={tProfile("currentCity")}
                            value={p.current_city}
                          />
                          <Detail
                            label={tProfile("houseArea")}
                            value={p.house_area}
                          />
                          <Detail label="Phone" value={p.phone} />
                          <Detail label="Email" value={p.email} />
                          <div className="sm:col-span-2 lg:col-span-3">
                            <Detail
                              label={tProfile("biography")}
                              value={localized(
                                locale,
                                p.bio_en,
                                p.bio_ur,
                              )}
                            />
                          </div>
                        </dl>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <Button
                        size="sm"
                        onClick={() => onApprove(p.id)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Spinner className="text-primary-foreground" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {t("approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setReason("");
                          setRejectId(p.id);
                        }}
                        disabled={busy}
                      >
                        <X className="size-4" />
                        {t("reject")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        labelledBy="reject-title"
      >
        <h2 id="reject-title" className="font-display text-xl text-forest-700">
          {t("reject")}
        </h2>
        <div className="mt-4 space-y-2">
          <Label htmlFor="reject-reason" required>
            {t("rejectReason")}
          </Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRejectId(null)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmReject}
            disabled={!reason.trim() || busyId === rejectId}
          >
            {busyId === rejectId && rejectId !== null ? (
              <Spinner className="text-destructive-foreground" />
            ) : null}
            {t("reject")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
