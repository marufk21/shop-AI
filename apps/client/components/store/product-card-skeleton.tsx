import { Skeleton } from "@workspace/ui/components/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      {/* Product Image Skeleton */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        <Skeleton className="h-full w-full rounded-none" />

        {/* Wishlist button placeholder */}
        <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3">
          <Skeleton className="size-7 sm:size-8 rounded-full" />
        </div>
      </div>

      {/* Details Skeletons */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {/* Category Label */}
        <Skeleton className="h-2.5 w-16 rounded" />

        {/* Name Title (matches line-clamp-2 on mobile, single line on desktop) */}
        <div className="mt-1.5 space-y-1">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-2/3 rounded sm:hidden" />
        </div>

        {/* Price & Stock info */}
        <div className="mt-auto flex items-end justify-between gap-1 pt-3">
          <Skeleton className="h-4.5 w-16 rounded sm:h-5 sm:w-20" />
          <Skeleton className="hidden h-3 w-10 rounded sm:inline-block" />
        </div>
      </div>
    </div>
  )
}
