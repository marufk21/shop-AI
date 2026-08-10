"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  ShoppingBag,
  SlidersHorizontal,
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { useStoreProducts } from "@/hooks/store/use-products"
import { ProductCard } from "@/components/store/product-card"

import { ProductCardSkeleton } from "@/components/store/product-card-skeleton"
import { staggerContainer, fadeInUp } from "@/lib/animation-variants"

const ITEMS_PER_PAGE = 12

interface CategoryPageContentProps {
  categoryName: string
}

export function CategoryPageContent({ categoryName }: CategoryPageContentProps) {
  const prefersReducedMotion = useReducedMotion()

  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState("Popular")
  const [currentPage, setCurrentPage] = React.useState(1)

  // Debounce search: update query param 300ms after user stops typing
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, sort])

  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const { data, isError, isLoading, isFetching, refetch } = useStoreProducts({
    skip,
    limit: ITEMS_PER_PAGE,
    category: categoryName,
    search: search || undefined,
  })

  const products = React.useMemo(() => data?.items ?? [], [data?.items])

  // Client-side sort only (backend always sorts by created_at DESC)
  // With 12 items per page, sorting is cheap
  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
      if (sort.includes("Low")) return a.price - b.price
      if (sort.includes("High")) return b.price - a.price
      if (sort === "Newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return a.name.localeCompare(b.name)
    })
  }, [products, sort])

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE))

  return (
    <>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 md:pt-8 pb-6 md:pb-10">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-2 sm:flex">
            <div className="relative min-w-0">
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded-lg border-border bg-background pl-7 pr-7 text-xs font-medium sm:w-40"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setSearch("") }}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v ?? "popular")}>
              <SelectTrigger className="h-8 w-full shrink-0 cursor-pointer rounded-lg border-border bg-background text-xs font-semibold sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Popular" className="text-xs">Popular</SelectItem>
                <SelectItem value="Price: Low → High" className="text-xs">Price: Low → High</SelectItem>
                <SelectItem value="Price: High → Low" className="text-xs">Price: High → Low</SelectItem>
                <SelectItem value="Newest" className="text-xs">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isLoading && (
            <span className="inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-muted/40 px-3 text-xs font-semibold text-muted-foreground sm:w-auto sm:justify-start">
              {data?.total?.toLocaleString() ?? 0} products
            </span>
          )}
        </div>

        {/* Products grid */}
        <div className="min-h-96">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-muted-foreground">Failed to load products.</p>
              <Button onClick={() => refetch()} size="sm" className="mt-4 rounded-xl">
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && sortedProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/20 mb-4" />
              <h3 className="font-heading text-base font-semibold">No products found</h3>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
            </div>
          )}

          {!isLoading && !isError && sortedProducts.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
              className={`grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
            >
              {sortedProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <CaretLeft className="size-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1
              const show =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              if (!show) {
                const isGap =
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                if (isGap) {
                  return (
                    <span key={page} className="flex size-8 items-center justify-center text-xs text-muted-foreground select-none">
                      …
                    </span>
                  )
                }
                return null
              }
              const isActive = page === currentPage
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer border ${isActive
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/25"
                    }`}
                >
                  {page}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <CaretRight className="size-3.5" />
            </button>
          </div>
        )}
        {!isLoading && totalPages > 5 && (
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>
    </>
  )
}
