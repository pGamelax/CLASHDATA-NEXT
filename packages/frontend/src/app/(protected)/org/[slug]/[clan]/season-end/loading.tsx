import { Skeleton } from "@/components/ui/skeleton";

export default function SeasonEndLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
