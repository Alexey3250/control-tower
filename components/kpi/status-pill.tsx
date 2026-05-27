import { Badge } from "@/components/ui/badge";
import type { StationStatus } from "@/lib/types";

const map: Record<
  StationStatus,
  { label: string; variant: "healthy" | "watch" | "critical" }
> = {
  healthy: { label: "Healthy", variant: "healthy" },
  watch: { label: "Watch", variant: "watch" },
  critical: { label: "Critical", variant: "critical" },
};

export function StatusPill({ status }: { status: StationStatus }) {
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
