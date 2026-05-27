"use client";

import { PageError } from "@/components/shell/page-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="Dashboard route failed"
      message={error.message || "A dashboard route failed while loading live data."}
      reset={reset}
    />
  );
}
