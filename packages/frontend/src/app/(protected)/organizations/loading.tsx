import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-11 w-48 rounded-md" />
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border-2 bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
