import {
  TopbarSkeleton,
  KpiStripSkeleton,
  TableSkeleton,
} from "@/components/shell/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton />
      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <Card>
          <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-28" />
          </CardContent>
        </Card>
        <KpiStripSkeleton count={4} />
        <Card>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <TableSkeleton rows={8} cols={6} />
      </div>
    </div>
  );
}
