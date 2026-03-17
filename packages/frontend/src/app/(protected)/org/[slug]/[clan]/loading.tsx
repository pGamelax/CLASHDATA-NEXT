import { Skeleton } from "@/components/ui/skeleton";

export default function ClanDashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Clan header card */}
      <Skeleton className="h-40 rounded-xl" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* War stats + info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>

      {/* Member list */}
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
