import {
  TopbarSkeleton,
  KpiStripSkeleton,
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
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-10 w-20 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </CardContent>
        </Card>
        <KpiStripSkeleton count={6} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
