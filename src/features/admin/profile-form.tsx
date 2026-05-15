"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  HONORIFICS,
  PROFESSIONS,
  QUALIFICATION_LEVELS,
  PROFILE_STATUSES,
} from "@/lib/constants";
import type { ProfileRow } from "@/lib/database.types";
import type { ActionResult } from "./actions";

export function ProfileForm({
  profile,
  action,
  backHref,
  locale,
}: {
  profile: ProfileRow;
  action: (fd: FormData) => Promise<ActionResult>;
  backHref?: string;
  locale: string;
}) {
  const ur = locale === "ur";
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("options.status");
  const tHon = useTranslations("options.honorific");
  const tProf = useTranslations("options.profession");
  const tQual = useTranslations("options.qualification");
  const tAdmin = useTranslations("admin.members");
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {done && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-forest-100 px-3 py-2 text-sm text-forest-700"
        >
          <CheckCircle2 className="size-4" />
          {tAdmin("updated")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="honorific">{t("honorific")}</Label>
          <Select
            id="honorific"
            name="honorific"
            defaultValue={profile.honorific ?? ""}
          >
            {HONORIFICS.map((h) => (
              <option key={h || "none"} value={h}>
                {tHon(h)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">{tAdmin("status")}</Label>
          <Select id="status" name="status" defaultValue={profile.status}>
            {PROFILE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="full_name_en" required>
            {t("fullNameEn")}
          </Label>
          <Input
            id="full_name_en"
            name="full_name_en"
            required
            defaultValue={profile.full_name_en}
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="father_name_en" required>
            {t("fatherNameEn")}
          </Label>
          <Input
            id="father_name_en"
            name="father_name_en"
            required
            defaultValue={profile.father_name_en}
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="grandfather_name_en">
            {t("grandfatherNameEn")}
          </Label>
          <Input
            id="grandfather_name_en"
            name="grandfather_name_en"
            defaultValue={profile.grandfather_name_en ?? ""}
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="date_of_birth">{t("dateOfBirth")}</Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            defaultValue={profile.date_of_birth ?? ""}
            dir="ltr"
          />
        </div>
        <div>
          <Label htmlFor="profession" required>
            {t("profession")}
          </Label>
          <Select
            id="profession"
            name="profession"
            defaultValue={profile.profession}
          >
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {tProf(p)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="qualification">{t("qualification")}</Label>
          <Input
            id="qualification"
            name="qualification"
            defaultValue={profile.qualification ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="qualification_level">
            {t("qualificationLevel")}
          </Label>
          <Select
            id="qualification_level"
            name="qualification_level"
            defaultValue={profile.qualification_level ?? ""}
          >
            <option value="">—</option>
            {QUALIFICATION_LEVELS.map((q) => (
              <option key={q} value={q}>
                {tQual(q)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="institute">{t("institute")}</Label>
          <Input
            id="institute"
            name="institute"
            defaultValue={profile.institute ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="current_city">{t("currentCity")}</Label>
          <Input
            id="current_city"
            name="current_city"
            defaultValue={profile.current_city ?? ""}
          />
        </div>

        <div>
          <Label htmlFor="house_area">{t("houseArea")}</Label>
          <Input
            id="house_area"
            name="house_area"
            defaultValue={profile.house_area ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            dir="ltr"
          />
        </div>

        <div>
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={profile.email ?? ""}
            dir="ltr"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">
              {ur ? "عرض البلد" : "Latitude"}
            </Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              defaultValue={profile.latitude ?? ""}
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="longitude">
              {ur ? "طول البلد" : "Longitude"}
            </Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              defaultValue={profile.longitude ?? ""}
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="bio_en">{t("bioEn")}</Label>
          <Textarea
            id="bio_en"
            name="bio_en"
            defaultValue={profile.bio_en ?? ""}
            rows={4}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="photo">{t("photo")}</Label>
        <Input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="file:me-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("photoHint")}</p>
      </div>

      <div className="space-y-3">
        <Checkbox
          name="hide_photo"
          value="true"
          defaultChecked={profile.hide_photo}
          label={t("hidePhoto")}
        />
        <Checkbox
          name="is_deceased"
          value="true"
          defaultChecked={profile.is_deceased}
          label={
            ur
              ? "مرحوم کے طور پر نشان زد کریں"
              : "Mark as marhoom (deceased)"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Spinner className="text-primary-foreground" />
          ) : null}
          {tCommon("save")}
        </Button>
        {backHref && (
          <Button type="button" variant="ghost" asChild>
            <Link href={backHref}>{tCommon("back")}</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
