"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadNetworkPdf, downloadXlsx } from "@/lib/exports";

export function ExportOverviewButton() {
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/network", { cache: "no-store" });
      const data = (await res.json()) as { rows: Record<string, unknown>[] };
      downloadXlsx(data.rows, "jetex-network-overview", "Network");
    } finally {
      setLoading(false);
    }
  }

  async function onPdf() {
    setLoading(true);
    try {
      const res = await fetch("/api/network", { cache: "no-store" });
      const data = (await res.json()) as { rows: Record<string, unknown>[] };
      await downloadNetworkPdf(data.rows);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onPdf} disabled={loading} variant="outline" size="sm">
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      <Button onClick={onClick} disabled={loading} variant="gold" size="sm">
        <Download className="h-4 w-4" />
        {loading ? "Preparing…" : "XLSX"}
      </Button>
    </div>
  );
}
