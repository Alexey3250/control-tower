"use client";

import { PageError } from "@/components/shell/page-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <PageError
      title="Fleet data unavailable"
      message="OpenSky fleet state or flight history could not be loaded. Retry, or check rate limits if this persists."
      reset={reset}
    />
  );
}
