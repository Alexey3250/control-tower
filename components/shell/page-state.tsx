import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PageLoading({ label = "Loading live data" }: { label?: string }) {
  return (
    <div className="flex-1 p-6">
      <Card>
        <CardContent className="p-8 flex items-center gap-3 text-jx-muted">
          <Loader2 className="h-4 w-4 animate-spin text-jx-gold" />
          <span className="text-sm">{label}…</span>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageError({
  title = "Something went wrong",
  message = "A live data source failed or returned an unexpected response.",
  reset,
}: {
  title?: string;
  message?: string;
  reset?: () => void;
}) {
  return (
    <div className="flex-1 p-6">
      <Card className="border-jx-critical/50">
        <CardContent className="p-8 space-y-3">
          <div className="flex items-center gap-2 text-jx-critical">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-display text-2xl">{title}</h2>
          </div>
          <p className="text-sm text-jx-muted max-w-2xl">{message}</p>
          {reset ? (
            <Button variant="gold" size="sm" onClick={reset}>
              Retry
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
