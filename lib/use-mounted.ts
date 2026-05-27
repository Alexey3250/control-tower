"use client";

import * as React from "react";

export function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // Mount detection is intentionally stateful: chart libraries need to wait
    // until the browser has laid out a real container before rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}
