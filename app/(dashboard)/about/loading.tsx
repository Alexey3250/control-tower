import { TopbarSkeleton } from "@/components/shell/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton title="About this project" />
      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <Card>
          <CardContent className="p-6 flex gap-5 items-start">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-full max-w-2xl" />
              <Skeleton className="h-3 w-5/6 max-w-2xl" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
