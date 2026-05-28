import {
  TopbarSkeleton,
  KpiStripSkeleton,
  TableSkeleton,
} from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <TopbarSkeleton title="Station Risk Score" />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <KpiStripSkeleton count={4} />
        <TableSkeleton rows={12} cols={7} />
      </div>
    </div>
  );
}
