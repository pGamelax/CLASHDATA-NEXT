import { Skeleton } from "@/components/ui/skeleton";

export default function NewOrgLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        <Skeleton className="h-5 w-36 mb-8" />

        <div className="mb-8 space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}
