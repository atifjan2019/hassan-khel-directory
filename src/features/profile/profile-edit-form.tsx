"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { PROFESSIONS, QUALIFICATION_LEVELS } from "@/lib/constants";
import type { ProfileRow } from "@/lib/database.types";
import { updateOwnProfile } from "./actions";

export function ProfileEditForm({
  profile,
  locale,
}: {
  profile: ProfileRow;
  locale: string;
}) {
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const tPage = useTranslations("profilePage");
  const tProf = useTranslations("options.profession");
  const tQual = useTranslations("options.qualification");
  const router = useRouter();
  const ur = locale === "ur";

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateOwnProfile(fd);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setSaved(true);
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
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md bg-forest-100 px-3 py-2 text-sm text-forest-700"
        >
          <CheckCircle2 className="size-4" />
          {tPage("saved")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="full_name_ur">{t("fullNameUr")}</Label>
          <Input
            id="full_name_ur"
            name="full_name_ur"
            defaultValue={profile.full_name_ur ?? ""}
            dir="rtl"
            className="font-nastaliq"
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
          <p className="mt-1 text-xs text-muted-foreground">
            {t("phoneHint")}
          </p>
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
          <p className="mt-1 text-xs text-muted-foreground">
            {t("emailHint")}
          </p>
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
            rows={4}
            defaultValue={profile.bio_en ?? ""}
            dir="ltr"
          />
        </div>
        <div>
          <Label htmlFor="bio_ur">{t("bioUr")}</Label>
          <Textarea
            id="bio_ur"
            name="bio_ur"
            rows={4}
            defaultValue={profile.bio_ur ?? ""}
            dir="rtl"
            className="font-nastaliq"
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

      <Checkbox
        name="hide_photo"
        value="true"
        defaultChecked={profile.hide_photo}
        label={t("hidePhoto")}
      />

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner className="text-primary-foreground" /> : null}
        {tCommon("save")}
      </Button>
    </form>
  );
}
