"use client";

import { PageError } from "@/components/shell/page-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageError
      title="Feasibility model unavailable"
      message="The model or external weather profile failed to load. Retry to rerun the request."
      reset={reset}
    />
  );
}
