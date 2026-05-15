"use client";

import { useRef, useState } from "react";
import {
  useForm,
  Controller,
  type SubmitHandler,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, ImageOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  HONORIFICS,
  PROFESSIONS,
  QUALIFICATION_LEVELS,
  COMMON_CITIES,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterFormValues } from "./schema";
import { submitRegistration } from "./actions";
import { FatherAutocomplete } from "./father-autocomplete";
import { LocationPicker, type LatLng } from "./location-picker";

const TOTAL_STEPS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** react-hook-form field names validated when leaving each step. */
const STEP_FIELDS: FieldPath<RegisterFormValues>[][] = [
  [
    "honorific",
    "full_name_en",
    "full_name_ur",
    "father_name_en",
    "father_name_ur",
    "grandfather_name_en",
    "grandfather_name_ur",
    "date_of_birth",
  ],
  [
    "profession",
    "qualification",
    "qualification_level",
    "institute",
    "current_city",
  ],
  ["house_area", "father_profile_id", "latitude", "longitude"],
  ["phone", "email", "hide_photo"],
  ["consent"],
];

function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "photo"}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export function RegisterWizard({ locale }: { locale: string }) {
  const t = useTranslations("register");
  const tOpt = useTranslations("options");
  const tCommon = useTranslations("common");

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const supabase = useRef(createClient());

  const {
    register,
    handleSubmit,
    trigger,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      honorific: "",
      qualification_level: "none",
      hide_photo: false,
    },
  });

  /** Translate a zod message key (or pass raw text through). */
  function fieldError(name: FieldPath<RegisterFormValues>): string | null {
    const msg = errors[name]?.message;
    if (!msg) return null;
    if (
      msg === "validationName" ||
      msg === "validationFather" ||
      msg === "validationConsent"
    ) {
      return t(msg);
    }
    return msg;
  }

  async function next() {
    const ok = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError(
        locale === "ur"
          ? "براہِ کرم ایک تصویر منتخب کریں"
          : "Please choose an image file",
      );
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(
        locale === "ur"
          ? "تصویر 5 میگابائٹ سے کم ہونی چاہیے"
          : "Image must be under 5 MB",
      );
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | undefined> {
    if (!photoFile) return undefined;
    const path = `registrations/${crypto.randomUUID()}-${safeFileName(
      photoFile.name,
    )}`;
    const { error } = await supabase.current.storage
      .from(STORAGE_BUCKET)
      .upload(path, photoFile, {
        cacheControl: "3600",
        contentType: photoFile.type,
        upsert: false,
      });
    if (error) throw new Error(error.message);
    return path;
  }

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    setSubmitting(true);
    setServerError(null);
    try {
      let photoUrl: string | undefined;
      try {
        photoUrl = await uploadPhoto();
      } catch (err) {
        setSubmitting(false);
        setServerError(
          err instanceof Error
            ? err.message
            : locale === "ur"
              ? "تصویر اپ لوڈ نہیں ہو سکی"
              : "Photo upload failed",
        );
        return;
      }

      const result = await submitRegistration({
        ...values,
        photo_url: photoUrl,
      });

      setSubmitting(false);
      if (result.ok) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setServerError(result.error || tCommon("error"));
      }
    } catch (err) {
      setSubmitting(false);
      setServerError(
        err instanceof Error ? err.message : tCommon("error"),
      );
    }
  };

  function resetAll() {
    reset();
    setStep(0);
    setSubmitted(false);
    setServerError(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  }

  const stepNames = [
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
  ];

  if (submitted) {
    return (
      <div className="card-paper mx-auto mt-8 max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-forest-100">
          <CheckCircle2 className="size-8 text-forest-700" aria-hidden />
        </div>
        <h2 className="font-display text-2xl text-forest-700">
          {t("successTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {t("successBody")}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={resetAll}>
            {t("submitAnother")}
          </Button>
          <Button asChild>
            <Link href="/directory">
              {locale === "ur" ? "ڈائریکٹری دیکھیں" : "Go to the directory"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const fatherProfileId = watch("father_profile_id");
  const fatherNameEn = watch("father_name_en");
  const lat = watch("latitude");
  const lng = watch("longitude");
  const location: LatLng | undefined =
    typeof lat === "number" && typeof lng === "number"
      ? { lat, lng }
      : undefined;

  return (
    <div className="card-paper mx-auto mt-8 max-w-2xl p-5 sm:p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">
            {stepNames[step]}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("step", { current: step + 1, total: TOTAL_STEPS })}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-cream-200"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step + 1}
          aria-label={t("step", {
            current: step + 1,
            total: TOTAL_STEPS,
          })}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{
              width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
            }}
          />
        </div>
        <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {stepNames.map((name, i) => (
            <li
              key={name}
              className={cn(
                i === step && "font-semibold text-primary",
                i < step && "text-forest-700",
              )}
            >
              {i + 1}. {name}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* STEP 1 — Identity */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="honorific">{t("honorific")}</Label>
              <Select id="honorific" {...register("honorific")}>
                {HONORIFICS.map((h) => (
                  <option key={h || "none"} value={h}>
                    {tOpt(`honorific.${h}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full_name_en" required>
                  {t("fullNameEn")}
                </Label>
                <Input
                  id="full_name_en"
                  dir="ltr"
                  autoComplete="name"
                  aria-invalid={!!errors.full_name_en}
                  {...register("full_name_en")}
                />
                {fieldError("full_name_en") && (
                  <p className="mt-1 text-xs text-destructive" role="alert">
                    {fieldError("full_name_en")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="full_name_ur">{t("fullNameUr")}</Label>
                <Input
                  id="full_name_ur"
                  dir="rtl"
                  {...register("full_name_ur")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="father_name_en" required>
                  {t("fatherNameEn")}
                </Label>
                <Input
                  id="father_name_en"
                  dir="ltr"
                  aria-invalid={!!errors.father_name_en}
                  {...register("father_name_en")}
                />
                {fieldError("father_name_en") && (
                  <p className="mt-1 text-xs text-destructive" role="alert">
                    {fieldError("father_name_en")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="father_name_ur">{t("fatherNameUr")}</Label>
                <Input
                  id="father_name_ur"
                  dir="rtl"
                  {...register("father_name_ur")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="grandfather_name_en">
                  {t("grandfatherNameEn")}
                </Label>
                <Input
                  id="grandfather_name_en"
                  dir="ltr"
                  {...register("grandfather_name_en")}
                />
              </div>
              <div>
                <Label htmlFor="grandfather_name_ur">
                  {t("grandfatherNameUr")}
                </Label>
                <Input
                  id="grandfather_name_ur"
                  dir="rtl"
                  {...register("grandfather_name_ur")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="date_of_birth">{t("dateOfBirth")}</Label>
              <Input
                id="date_of_birth"
                type="date"
                dir="ltr"
                {...register("date_of_birth")}
              />
            </div>
          </div>
        )}

        {/* STEP 2 — Education & Work */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="profession" required>
                {t("profession")}
              </Label>
              <Select
                id="profession"
                aria-invalid={!!errors.profession}
                {...register("profession")}
              >
                <option value="" disabled>
                  {tCommon("filter")}…
                </option>
                {PROFESSIONS.map((p) => (
                  <option key={p} value={p}>
                    {tOpt(`profession.${p}`)}
                  </option>
                ))}
              </Select>
              {fieldError("profession") && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {locale === "ur"
                    ? "براہِ کرم پیشہ منتخب کریں"
                    : "Please select a profession"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="qualification">{t("qualification")}</Label>
              <Input id="qualification" {...register("qualification")} />
            </div>

            <div>
              <Label htmlFor="qualification_level">
                {t("qualificationLevel")}
              </Label>
              <Select
                id="qualification_level"
                {...register("qualification_level")}
              >
                {QUALIFICATION_LEVELS.map((q) => (
                  <option key={q} value={q}>
                    {tOpt(`qualification.${q}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="institute">{t("institute")}</Label>
              <Input id="institute" {...register("institute")} />
            </div>

            <div>
              <Label htmlFor="current_city">{t("currentCity")}</Label>
              <Input
                id="current_city"
                list="register-cities"
                {...register("current_city")}
              />
              <datalist id="register-cities">
                {COMMON_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {/* STEP 3 — Village & Family */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="house_area">{t("houseArea")}</Label>
              <Input id="house_area" {...register("house_area")} />
            </div>

            <FatherAutocomplete
              locale={locale}
              value={fatherProfileId}
              currentFatherName={fatherNameEn}
              onSelect={(id, label) => {
                setValue("father_profile_id", id, {
                  shouldValidate: true,
                });
                if (label) {
                  setValue("father_name_en", label, {
                    shouldValidate: true,
                  });
                }
              }}
            />

            <LocationPicker
              locale={locale}
              value={location}
              onChange={(p) => {
                setValue("latitude", p?.lat, { shouldValidate: true });
                setValue("longitude", p?.lng, { shouldValidate: true });
              }}
            />
          </div>
        )}

        {/* STEP 4 — Contact & Photo */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                autoComplete="tel"
                {...register("phone")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("phoneHint")}
              </p>
            </div>

            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                inputMode="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("emailHint")}
              </p>
              {errors.email && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {locale === "ur"
                    ? "درست ای میل درج کریں"
                    : "Enter a valid email"}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="photo">{t("photo")}</Label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="block w-full text-sm text-foreground file:me-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("photoHint")}
              </p>
              {photoError && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                  {photoError}
                </p>
              )}
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt={t("photo")}
                  className="mt-3 size-28 rounded-md object-cover ring-1 ring-border"
                />
              )}
            </div>

            <div className="rounded-md bg-cream-100 p-3">
              <Controller
                control={control}
                name="hide_photo"
                render={({ field }) => (
                  <Checkbox
                    id="hide_photo"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    label={
                      <span className="flex items-start gap-1.5">
                        <ImageOff
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        {t("hidePhoto")}
                      </span>
                    }
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* STEP 5 — Review & Submit */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {t("reviewIntro")}
            </p>

            <ReviewSummary
              t={t}
              tOpt={tOpt}
              values={getValues()}
              hasPhoto={!!photoFile}
              locale={locale}
            />

            <div className="rounded-md border border-accent/40 bg-accent/10 p-4">
              <Controller
                control={control}
                name="consent"
                render={({ field }) => (
                  <Checkbox
                    id="consent"
                    checked={field.value === true}
                    onChange={(e) =>
                      field.onChange(e.target.checked ? true : undefined)
                    }
                    aria-invalid={!!errors.consent}
                    label={t("consent")}
                  />
                )}
              />
              {fieldError("consent") && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {fieldError("consent")}
                </p>
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                <span>
                  <strong className="font-semibold">
                    {t("errorTitle")}
                  </strong>
                  <br />
                  {serverError}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nav controls */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || submitting}
            className={cn(step === 0 && "invisible")}
          >
            {tCommon("back")}
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={next}>
              {tCommon("next")}
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  {tCommon("submitting")}
                </>
              ) : (
                tCommon("submit")
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

/** Read-only localized summary for the final review step. */
function ReviewSummary({
  t,
  tOpt,
  values,
  hasPhoto,
  locale,
}: {
  t: ReturnType<typeof useTranslations>;
  tOpt: ReturnType<typeof useTranslations>;
  values: RegisterFormValues;
  hasPhoto: boolean;
  locale: string;
}) {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string | undefined | null) => {
    if (value && String(value).trim()) rows.push({ label, value });
  };

  const honorificLabel =
    values.honorific && values.honorific.length > 0
      ? tOpt(`honorific.${values.honorific}`)
      : "";

  push(
    t("fullNameEn"),
    [honorificLabel, values.full_name_en].filter(Boolean).join(" "),
  );
  push(t("fullNameUr"), values.full_name_ur);
  push(t("fatherNameEn"), values.father_name_en);
  push(t("fatherNameUr"), values.father_name_ur);
  push(t("grandfatherNameEn"), values.grandfather_name_en);
  push(t("grandfatherNameUr"), values.grandfather_name_ur);
  push(t("dateOfBirth"), values.date_of_birth);
  push(
    t("profession"),
    values.profession ? tOpt(`profession.${values.profession}`) : undefined,
  );
  push(t("qualification"), values.qualification);
  push(
    t("qualificationLevel"),
    values.qualification_level
      ? tOpt(`qualification.${values.qualification_level}`)
      : undefined,
  );
  push(t("institute"), values.institute);
  push(t("currentCity"), values.current_city);
  push(t("houseArea"), values.house_area);
  push(
    t("linkFather"),
    values.father_profile_id
      ? locale === "ur"
        ? "منسلک"
        : "Linked"
      : t("linkFatherNone"),
  );
  push(
    t("dropPin"),
    typeof values.latitude === "number" &&
      typeof values.longitude === "number"
      ? `${values.latitude.toFixed(5)}, ${values.longitude.toFixed(5)}`
      : undefined,
  );
  push(t("phone"), values.phone);
  push(t("email"), values.email);
  push(
    t("photo"),
    hasPhoto
      ? locale === "ur"
        ? "منتخب"
        : "Selected"
      : locale === "ur"
        ? "کوئی نہیں"
        : "None",
  );

  return (
    <dl className="divide-y divide-border rounded-md border border-border bg-card">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4"
        >
          <dt className="text-xs font-medium text-muted-foreground sm:w-48 sm:shrink-0">
            {r.label}
          </dt>
          <dd className="text-sm text-foreground">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
