"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Pencil, Trash2, Plus, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { formatDate, localized } from "@/lib/utils";
import type { NewsRow } from "@/lib/database.types";
import { createNews, updateNews, deleteNews } from "./actions";

export function NewsEditor({
  posts,
  locale,
}: {
  posts: NewsRow[];
  locale: string;
}) {
  const t = useTranslations("admin.news");
  const tCat = useTranslations("options.newsCategory");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setShowForm(true);
    setSaved(false);
    setError(null);
  }

  function openEdit(p: NewsRow) {
    setEditing(p);
    setShowForm(true);
    setSaved(false);
    setError(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const target = editing;
    startTransition(async () => {
      const res = target
        ? await updateNews(target.id, fd)
        : await createNews(fd);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setSaved(true);
      setShowForm(false);
      setEditing(null);
      router.refresh();
    });
  }

  function onConfirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    startTransition(async () => {
      const res = await deleteNews(id);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
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
          {t("saved")}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">{t("title")}</h1>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          {t("create")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h2 className="mb-4 font-display text-xl text-forest-700">
              {editing ? t("editing") : t("create")}
            </h2>
            <form
              onSubmit={onSubmit}
              className="space-y-4"
              key={editing?.id ?? "new"}
            >
              <div>
                <Label htmlFor="title_en" required>
                  {t("titleEn")}
                </Label>
                <Input
                  id="title_en"
                  name="title_en"
                  required
                  defaultValue={editing?.title_en ?? ""}
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="body_en" required>
                  {t("bodyEn")}
                </Label>
                <Textarea
                  id="body_en"
                  name="body_en"
                  required
                  rows={5}
                  defaultValue={editing?.body_en ?? ""}
                  dir="ltr"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="category">{t("category")}</Label>
                  <Select
                    id="category"
                    name="category"
                    defaultValue={editing?.category ?? "general"}
                  >
                    {NEWS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {tCat(c)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="published_at">{t("publishedAt")}</Label>
                  <Input
                    id="published_at"
                    name="published_at"
                    type="date"
                    defaultValue={
                      editing?.published_at
                        ? editing.published_at.slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="cover">{t("cover")}</Label>
                  <Input
                    id="cover"
                    name="cover"
                    type="file"
                    accept="image/*"
                    className="file:me-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                  />
                </div>
              </div>

              <Checkbox
                name="is_pinned"
                value="true"
                defaultChecked={editing?.is_pinned ?? false}
                label={t("pin")}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <Spinner className="text-primary-foreground" />
                  ) : null}
                  {editing ? t("update") : t("publish")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <ul className="grid gap-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {localized(locale, p.title_en)}
                    </span>
                    <Badge variant="outline">{tCat(p.category)}</Badge>
                    {p.is_pinned && (
                      <Badge variant="accent">
                        <Pin className="size-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(p.published_at, locale)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="size-4" />
                    {tCommon("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(p.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        labelledBy="news-del"
      >
        <h2 id="news-del" className="font-display text-xl text-forest-700">
          {tCommon("delete")}
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
            disabled={pending}
          >
            {pending ? (
              <Spinner className="text-destructive-foreground" />
            ) : null}
            {tCommon("delete")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
