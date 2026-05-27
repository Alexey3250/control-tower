"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadXlsx } from "@/lib/exports";

export function ExportLaunchesButton() {
  const [loading, setLoading] = React.useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/launches", { cache: "no-store" });
      const data = (await res.json()) as { rows: Record<string, unknown>[] };
      downloadXlsx(data.rows, "jetex-launch-pipeline", "Launches");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={loading} variant="gold" size="sm">
      <Download className="h-4 w-4" />
      {loading ? "Preparing…" : "Export .xlsx"}
    </Button>
  );
}
