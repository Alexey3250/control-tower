"use client";

import { PageError } from "@/components/shell/page-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageError
      title="Station detail unavailable"
      message="Station KPIs or NOAA weather could not be loaded. Retry to refresh the live feeds."
      reset={reset}
    />
  );
}
