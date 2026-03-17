import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerPushLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Day pills */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-8" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-9 w-full rounded-lg" />

      {/* Player rows */}
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
