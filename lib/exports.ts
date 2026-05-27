"use client";

import * as XLSX from "xlsx";

export function downloadXlsx(
  rows: Record<string, unknown>[],
  fileBase: string,
  sheetName = "Sheet1"
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileBase}.xlsx`);
}

export function downloadCsv(rows: Record<string, unknown>[], fileBase: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileBase}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadNetworkPdf(rows: Record<string, unknown>[]) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const critical = rows.filter((r) => r.Status === "critical").length;
  const watch = rows.filter((r) => r.Status === "watch").length;
  const turns = rows.reduce((s, r) => s + Number(r["Turns 24h"] ?? 0), 0);
  const pax = rows.reduce((s, r) => s + Number(r["PAX 24h"] ?? 0), 0);
  const top = [...rows]
    .sort((a, b) => Number(b["Risk Score"] ?? 0) - Number(a["Risk Score"] ?? 0))
    .slice(0, 10);

  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 595, 842, "F");
  doc.setTextColor(245, 245, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Jetex Network Operations Control Tower", 40, 48);
  doc.setFontSize(12);
  doc.setTextColor(201, 166, 107);
  doc.text("Executive Network Health Summary", 40, 70);

  doc.setTextColor(245, 245, 245);
  doc.setFontSize(11);
  const lines = [
    `Stations tracked: ${rows.length}`,
    `Critical stations: ${critical}`,
    `Watch stations: ${watch}`,
    `Turns last 24h: ${turns.toLocaleString()}`,
    `PAX last 24h: ${pax.toLocaleString()}`,
    `Generated: ${new Date().toLocaleString()}`,
  ];
  lines.forEach((line, i) => doc.text(line, 40, 112 + i * 18));

  doc.setFont("helvetica", "bold");
  doc.setTextColor(201, 166, 107);
  doc.text("Top stations needing attention", 40, 250);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(245, 245, 245);
  top.forEach((row, i) => {
    const y = 280 + i * 22;
    doc.text(
      `${i + 1}. ${row.City} (${row.ICAO}) - risk ${row["Risk Score"]} - ${row["Top Risk"]}`,
      40,
      y
    );
  });

  doc.setTextColor(161, 161, 161);
  doc.setFontSize(9);
  doc.text(
    "Synthetic operational dataset with public aviation/weather sources where available. Not affiliated with Jetex.",
    40,
    805
  );
  doc.save("jetex-network-overview.pdf");
}

export async function downloadFeasibilityPdf(result: {
  inputs: {
    airportCode: string;
    city: string;
    fboTier: string;
    staffingModel: string;
    expectedMovementsMonth: number;
  };
  verdict: string;
  compositeScore: number;
  rationale: string[];
  conditions: string[];
  financial: {
    monthlyRevenueUsd: number;
    monthlyOpexUsd: number;
    monthlyEbitdaUsd: number;
    threeYearNpvUsd: number;
    breakevenMonths: number;
  };
}) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 595, 842, "F");
  doc.setTextColor(245, 245, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FBO Feasibility Study", 40, 48);
  doc.setTextColor(201, 166, 107);
  doc.setFontSize(14);
  doc.text(
    `${result.inputs.city ?? ""} (${result.inputs.airportCode ?? ""}) - ${result.verdict}`,
    40,
    75
  );

  doc.setTextColor(245, 245, 245);
  doc.setFontSize(12);
  const summary = [
    `Composite score: ${result.compositeScore}/100`,
    `FBO tier: ${result.inputs.fboTier}`,
    `Staffing model: ${result.inputs.staffingModel}`,
    `Monthly movements: ${result.inputs.expectedMovementsMonth}`,
    `Monthly revenue: ${formatPdfCurrency(result.financial.monthlyRevenueUsd)}`,
    `Monthly OpEx: ${formatPdfCurrency(result.financial.monthlyOpexUsd)}`,
    `Monthly EBITDA: ${formatPdfCurrency(result.financial.monthlyEbitdaUsd)}`,
    `3-year NPV: ${formatPdfCurrency(result.financial.threeYearNpvUsd)}`,
    `Breakeven: ${
      Number(result.financial.breakevenMonths) > 0
        ? `${result.financial.breakevenMonths} months`
        : "not within model horizon"
    }`,
  ];
  summary.forEach((line, i) => doc.text(line, 40, 120 + i * 18));

  doc.setTextColor(201, 166, 107);
  doc.setFont("helvetica", "bold");
  doc.text("Decision rationale", 40, 310);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(245, 245, 245);
  result.rationale.forEach((line, i) => doc.text(`- ${line}`, 40, 338 + i * 18));

  doc.setTextColor(201, 166, 107);
  doc.setFont("helvetica", "bold");
  doc.text("Conditions / watch items", 40, 430);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(245, 245, 245);
  const conditions = result.conditions.length
    ? result.conditions
    : ["No upgrade conditions generated by the current model."];
  conditions.slice(0, 10).forEach((line, i) => {
    const wrapped = doc.splitTextToSize(`- ${line}`, 500);
    doc.text(wrapped, 40, 458 + i * 34);
  });

  doc.setTextColor(161, 161, 161);
  doc.setFontSize(9);
  doc.text(
    "Illustrative synthetic financial model for portfolio/demo use.",
    40,
    805
  );
  doc.save(`jetex-feasibility-${result.inputs.airportCode ?? "model"}.pdf`);
}

function formatPdfCurrency(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}
