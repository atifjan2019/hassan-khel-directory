"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Images,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/shared/avatar";
import { formatDate, localized } from "@/lib/utils";
import type { AlbumRow, AlbumPhotoRow } from "@/lib/database.types";
import {
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addAlbumPhoto,
  updateAlbumPhoto,
  deleteAlbumPhoto,
} from "./actions";

interface Props {
  albums: AlbumRow[];
  selected: { album: AlbumRow; photos: AlbumPhotoRow[] } | null;
  locale: string;
}

export function AlbumManager({ albums, selected, locale }: Props) {
  const t = useTranslations("admin.albums");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AlbumRow | null>(null);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function select(id: string | null) {
    router.push(id ? `?album=${id}` : "?");
  }

  function onAlbumSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const target = editing;
    startTransition(async () => {
      const res = target
        ? await updateAlbum(target.id, fd)
        : await createAlbum(fd);
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

  function onAddPhotos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await addAlbumPhoto(selected.album.id, fd);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  function onPhotoMeta(e: React.FormEvent<HTMLFormElement>, photoId: string) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateAlbumPhoto(photoId, fd);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function confirmDeleteAlbum() {
    if (!deleteAlbumId) return;
    const id = deleteAlbumId;
    startTransition(async () => {
      const res = await deleteAlbum(id);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setDeleteAlbumId(null);
      if (selected?.album.id === id) router.push("?");
      else router.refresh();
    });
  }

  function confirmDeletePhoto() {
    if (!deletePhotoId) return;
    const id = deletePhotoId;
    startTransition(async () => {
      const res = await deleteAlbumPhoto(id);
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      setDeletePhotoId(null);
      router.refresh();
    });
  }

  const notice = (
    <>
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
    </>
  );

  /* ── Photo management view for a selected album ── */
  if (selected) {
    const { album, photos } = selected;
    return (
      <div className="space-y-6">
        {notice}
        <Button variant="ghost" size="sm" onClick={() => select(null)}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {tCommon("back")}
        </Button>

        <div>
          <h1 className="text-3xl">
            {localized(locale, album.title_en)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {formatDate(album.event_date, locale)}
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-lg text-forest-700">
              {t("addPhotos")}
            </h2>
            <form onSubmit={onAddPhotos} className="space-y-4">
              <div>
                <Label htmlFor="photos">{t("photos")}</Label>
                <Input
                  id="photos"
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                  className="file:me-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                />
              </div>
              <div>
                <Label htmlFor="caption_en">{t("caption")}</Label>
                <Input id="caption_en" name="caption_en" dir="ltr" />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <Plus className="size-4" />
                )}
                {t("addPhotos")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {photos.map((ph) => (
              <li key={ph.id}>
                <Card>
                  <CardContent className="flex gap-3 p-3">
                    <Avatar
                      src={ph.image_url}
                      alt={ph.caption_en ?? "photo"}
                      size={72}
                      rounded="lg"
                      className="shrink-0"
                    />
                    <form
                      onSubmit={(e) => onPhotoMeta(e, ph.id)}
                      className="min-w-0 flex-1 space-y-2"
                    >
                      <Input
                        name="caption_en"
                        defaultValue={ph.caption_en ?? ""}
                        placeholder={t("caption")}
                        dir="ltr"
                      />
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`ord-${ph.id}`}
                          className="mb-0 shrink-0"
                        >
                          {t("order")}
                        </Label>
                        <Input
                          id={`ord-${ph.id}`}
                          name="display_order"
                          type="number"
                          defaultValue={ph.display_order}
                          className="w-20"
                          dir="ltr"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                        >
                          {tCommon("save")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletePhotoId(ph.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Dialog
          open={deletePhotoId !== null}
          onClose={() => setDeletePhotoId(null)}
          labelledBy="ph-del"
        >
          <h2 id="ph-del" className="font-display text-xl text-forest-700">
            {tCommon("delete")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("deletePhotoConfirm")}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletePhotoId(null)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePhoto}
              disabled={pending}
            >
              {tCommon("delete")}
            </Button>
          </div>
        </Dialog>
      </div>
    );
  }

  /* ── Album list + create/edit view ── */
  return (
    <div className="space-y-6">
      {notice}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">{t("title")}</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
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
              onSubmit={onAlbumSubmit}
              className="space-y-4"
              key={editing?.id ?? "new"}
            >
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="title_ur">{t("titleUr")}</Label>
                  <Input
                    id="title_ur"
                    name="title_ur"
                    defaultValue={editing?.title_ur ?? ""}
                    dir="rtl"
                    className="font-nastaliq"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="event_date" required>
                    {t("eventDate")}
                  </Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="date"
                    required
                    defaultValue={
                      editing?.event_date
                        ? editing.event_date.slice(0, 10)
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="description_en">{t("descEn")}</Label>
                  <Textarea
                    id="description_en"
                    name="description_en"
                    rows={3}
                    defaultValue={editing?.description_en ?? ""}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="description_ur">{t("descUr")}</Label>
                  <Textarea
                    id="description_ur"
                    name="description_ur"
                    rows={3}
                    defaultValue={editing?.description_ur ?? ""}
                    dir="rtl"
                    className="font-nastaliq"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <Spinner className="text-primary-foreground" />
                  ) : null}
                  {tCommon("save")}
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

      {albums.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {locale === "ur" ? "ابھی کوئی البم نہیں۔" : "No albums yet."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {albums.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="flex gap-3 p-4">
                  <Avatar
                    src={a.cover_image_url}
                    alt={a.title_en}
                    size={64}
                    rounded="lg"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {localized(locale, a.title_en, a.title_ur)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(a.event_date, locale)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => select(a.id)}
                      >
                        <Images className="size-4" />
                        {t("photos")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(a);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="size-4" />
                        {tCommon("edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteAlbumId(a.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={deleteAlbumId !== null}
        onClose={() => setDeleteAlbumId(null)}
        labelledBy="al-del"
      >
        <h2 id="al-del" className="font-display text-xl text-forest-700">
          {tCommon("delete")}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("deleteAlbumConfirm")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteAlbumId(null)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDeleteAlbum}
            disabled={pending}
          >
            {tCommon("delete")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
