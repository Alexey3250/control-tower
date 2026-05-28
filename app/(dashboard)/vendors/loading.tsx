import {
  TopbarSkeleton,
  KpiStripSkeleton,
} from "@/components/shell/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton title="Vendor Scorecard" />
      <div className="flex-1 p-4 md:p-6 space-y-5">
        <KpiStripSkeleton count={4} />
        <Card>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-48" />
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, r) => (
                <div key={r} className="grid grid-cols-6 gap-2">
                  <Skeleton className="h-8 col-span-2" />
                  {Array.from({ length: 4 }).map((__, c) => (
                    <Skeleton key={c} className="h-8" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
