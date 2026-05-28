import {
  TopbarSkeleton,
  KpiStripSkeleton,
} from "@/components/shell/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton title="Feasibility Studio" />
      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <KpiStripSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 md:gap-5">
          <Card>
            <CardContent className="p-4 md:p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 md:p-5 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-5 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
