import { Skeleton } from "@/components/ui/skeleton";

export default function CurrentWarLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* War header card: status + clan vs opponent + bars */}
      <Skeleton className="h-64 rounded-xl" />

      {/* Win prediction */}
      <Skeleton className="h-36 rounded-xl" />

      {/* Tabs */}
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
