"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { exportMembers } from "./actions";

function csvCell(value: string | null): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function ExportButton() {
  const t = useTranslations("admin.reports");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onExport() {
    setError(null);
    startTransition(async () => {
      const res = await exportMembers();
      if (!res.ok) {
        setError(res.error ?? tCommon("error"));
        return;
      }
      const header = ["name", "father", "profession", "city", "status"];
      const lines = [
        header.join(","),
        ...res.rows.map((r) =>
          [
            csvCell(r.full_name_en),
            csvCell(r.father_name_en),
            csvCell(r.profession),
            csvCell(r.current_city),
            csvCell(r.status),
          ].join(","),
        ),
      ];
      const blob = new Blob(["﻿" + lines.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hassan-khel-members-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button onClick={onExport} disabled={pending} variant="outline">
        {pending ? <Spinner /> : <Download className="size-4" />}
        {t("export")}
      </Button>
    </div>
  );
}
