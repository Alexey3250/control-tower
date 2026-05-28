import {
  TopbarSkeleton,
  PageBodySkeleton,
} from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton title="Network Overview" />
      <PageBodySkeleton />
    </div>
  );
}
