import { Skeleton } from "@/components/ui/skeleton";

export default function SeasonEndLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Season selector skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Meta skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Player rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
