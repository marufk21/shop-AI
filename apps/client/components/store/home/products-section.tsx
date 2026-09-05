"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import {
  MagnifyingGlass,
  SlidersHorizontal,
  FolderOpen,
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  X,
  Tag,
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

import { Slider } from "@workspace/ui/components/slider"

import Link from "next/link"
import { useStoreProducts } from "@/hooks/store/use-products"
import { ProductCard } from "@/components/store/product-card"
import { ProductCardSkeleton } from "@/components/store/product-card-skeleton"
import { staggerContainer, fadeInUp } from "@/lib/animation-variants"

const ITEMS_PER_PAGE = 12

type CategoryTree = Record<string, string[]>

function parseCategoryHierarchy(category: string): {
  master: string
  articleType: string
} {
  const parts = category.split(">").map((s) => s.trim())
  return {
    master: parts[0] ?? category,
    articleType: parts[parts.length - 1] ?? category,
  }
}

function buildCategoryTree(products: { category: string }[]): {
  masters: string[]
  articlesByMaster: CategoryTree
  productCountByMaster: Record<string, number>
  productCountByArticle: Record<string, number>
} {
  const masterSet = new Set<string>()
  const articlesByMaster: CategoryTree = {}
  const productCountByMaster: Record<string, number> = {}
  const productCountByArticle: Record<string, number> = {}

  for (const product of products) {
    const { master, articleType } = parseCategoryHierarchy(product.category)

    masterSet.add(master)

    if (!articlesByMaster[master]) {
      articlesByMaster[master] = []
    }
    if (!articlesByMaster[master].includes(articleType)) {
      articlesByMaster[master].push(articleType)
    }

    productCountByMaster[master] = (productCountByMaster[master] ?? 0) + 1
    productCountByArticle[articleType] =
      (productCountByArticle[articleType] ?? 0) + 1
  }

  return {
    masters: Array.from(masterSet).sort(),
    articlesByMaster,
    productCountByMaster,
    productCountByArticle,
  }
}

export function ProductsSection({
  initialSearch = "",
}: {
  initialSearch?: string
}) {
  const prefersReducedMotion = useReducedMotion()

  const [search, setSearch] = React.useState(initialSearch)

  // Sync the query from the URL (e.g. navbar search) into the local filter
  // state when it changes while already on this page.
  React.useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])
  const [masterCategory, setMasterCategory] = React.useState("All")
  const [articleType, setArticleType] = React.useState("All")
  const [sort, setSort] = React.useState("popular")
  const [currentPage, setCurrentPage] = React.useState(1)
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, masterCategory, articleType, sort])

  const { data, isError, isLoading, refetch } = useStoreProducts({ limit: 200 })
  const products = React.useMemo(() => data?.items ?? [], [data?.items])

  // Compute max price from products
  const maxPrice = React.useMemo(() => {
    if (products.length === 0) return 10000
    return Math.ceil(Math.max(...products.map((p) => p.price), 100))
  }, [products])

  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 10000])

  React.useEffect(() => {
    setPriceRange([0, maxPrice])
  }, [maxPrice])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, masterCategory, articleType, sort, priceRange])

  const { masters, articlesByMaster, productCountByMaster } =
    React.useMemo(() => buildCategoryTree(products), [products])

  const visibleArticleTypes = React.useMemo(() => {
    if (masterCategory === "All") return []
    return articlesByMaster[masterCategory] ?? []
  }, [masterCategory, articlesByMaster])

  // Reset article type when master changes
  React.useEffect(() => {
    setArticleType("All")
  }, [masterCategory])

  const filteredAndSortedProducts = React.useMemo(() => {
    return products
      .filter((p) => {
        const { master, articleType: pArticle } = parseCategoryHierarchy(
          p.category,
        )

        if (masterCategory !== "All" && master !== masterCategory) return false
        if (articleType !== "All" && pArticle !== articleType) return false
        // Price range filter
        if (p.price < priceRange[0] || p.price > priceRange[1]) return false

        const matchesSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
        return matchesSearch
      })
      .sort((a, b) => {
        if (sort === "price-low") return a.price - b.price
        if (sort === "price-high") return b.price - a.price
        if (sort === "newest")
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return a.name.localeCompare(b.name)
      })
  }, [products, search, masterCategory, articleType, sort, priceRange])

  const paginatedProducts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedProducts, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE))

  return (
    <section id="products" className="py-10 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Header ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-end justify-between gap-3"
        >
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            All Products
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {isLoading ? "..." : `${filteredAndSortedProducts.length} items`}
            </span>
          </h2>

          <div className="h-8 px-3 hidden sm:flex items-center rounded-lg border border-border bg-muted/40 text-xs font-semibold text-muted-foreground whitespace-nowrap">
            {isLoading ? "—" : `${filteredAndSortedProducts.length} products`}
          </div>
        </motion.div>

        {/* ── Filter toolbar: categories | search | sort ── */}
        <div className="mb-8 space-y-3">

          {/* ── Primary row: Master categories ── */}
          <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* All master pill */}
            <button
              onClick={() => setMasterCategory("All")}
              className={`h-8 px-3.5 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-all duration-200 border ${
                masterCategory === "All"
                  ? "bg-foreground border-foreground text-background shadow-sm"
                  : "bg-background border-border hover:border-foreground/25 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              All
              <span className="ml-1.5 text-[10px] opacity-60">
                ({products.length})
              </span>
            </button>

            {isLoading && masters.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 rounded-lg bg-muted animate-pulse shrink-0"
                  />
                ))
              : masters.map((master) => {
                  const active = masterCategory === master
                  const count = productCountByMaster[master] ?? 0
                  return (
                    <Link
                      key={master}
                      href={`/store/category/${encodeURIComponent(master.toLowerCase())}`}
                      onClick={() => setMasterCategory(master)}
                      className={`h-8 px-3.5 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-all duration-200 border inline-flex items-center ${
                        active
                          ? "bg-foreground border-foreground text-background shadow-sm"
                          : "bg-background border-border hover:border-foreground/25 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {master}
                      <span className="ml-1.5 text-[10px] opacity-60">
                        ({count})
                      </span>
                    </Link>
                  )
                })}
          </div>

          {/* ── Secondary row: Article types (visible when a master is selected) ── */}
          {masterCategory !== "All" && visibleArticleTypes.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="scrollbar-hide flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <Tag className="size-3 text-muted-foreground shrink-0" />

              {/* All article types under this master */}
              <button
                onClick={() => setArticleType("All")}
                className={`h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-all duration-200 border ${
                  articleType === "All"
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-background border-border hover:border-primary/25 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                }`}
              >
                All {masterCategory}
              </button>

              {visibleArticleTypes.map((at) => {
                const active = articleType === at
                return (
                  <button
                    key={at}
                    onClick={() => setArticleType(at)}
                    className={`h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0 transition-all duration-200 border capitalize ${
                      active
                        ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                        : "bg-background border-border hover:border-primary/25 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {at}
                  </button>
                )
              })}
            </motion.div>
          )}

          {/* ── Price Range Slider ── */}
          <div className="flex items-center gap-3 px-1">
            <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
              Price
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-12 text-right shrink-0">
              ${priceRange[0]}
            </span>
            <Slider
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as [number, number])}
              min={0}
              max={maxPrice}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] font-medium text-muted-foreground tabular-nums w-12 shrink-0">
              ${priceRange[1]}
            </span>
          </div>

          {/* ── Search + Sort row ── */}
          <div className="flex items-center gap-2">
            {/* Compact search input */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-7 w-40 sm:w-44 pl-7 pr-7 rounded-lg border-border bg-background text-[11px] font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Sort select */}
            <Select value={sort} onValueChange={(v) => setSort(v ?? "popular")}>
              <SelectTrigger className="h-7 w-36 sm:w-40 shrink-0 rounded-lg border-border bg-background text-[11px] font-semibold cursor-pointer gap-1.5 capitalize">
                <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl p-1">
                <SelectItem value="popular" className="text-xs font-medium rounded-lg cursor-pointer py-1.5 capitalize">
                  Alphabetical
                </SelectItem>
                <SelectItem value="price-low" className="text-xs font-medium rounded-lg cursor-pointer py-1.5 capitalize">
                  Price: Low → High
                </SelectItem>
                <SelectItem value="price-high" className="text-xs font-medium rounded-lg cursor-pointer py-1.5 capitalize">
                  Price: High → Low
                </SelectItem>
                <SelectItem value="newest" className="text-xs font-medium rounded-lg cursor-pointer py-1.5 capitalize">
                  Newest Arrivals
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Products grid ── */}
        <div className="min-h-96">
          {isLoading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-border/60 rounded-xl">
              <div className="size-14 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
                <ArrowClockwise className="size-6" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Failed to load products
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                There was an issue connecting to the server. Please try again.
              </p>
              <Button
                onClick={() => refetch()}
                size="sm"
                className="mt-5 h-8 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <ArrowClockwise className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && filteredAndSortedProducts.length === 0 && (
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-border/60 rounded-xl"
            >
              <div className="size-14 rounded-xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
                <FolderOpen className="size-6" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                No products found
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                Nothing matched your filters. Try a different search or category.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMasterCategory("All")
                  setArticleType("All")
                }}
                className="mt-5 h-8 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </Button>
            </motion.div>
          )}

          {!isLoading && !isError && filteredAndSortedProducts.length > 0 && (
            <motion.div
              key={masterCategory + articleType + sort + currentPage}
              variants={staggerContainer}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate="visible"
              className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            >
              {paginatedProducts.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-1.5">
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
              const isActive = page === currentPage
              // Show first, last, current ±1, and ellipsis
              const show =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1

              if (!show) {
                const isEllipsis =
                  (page === 2 && currentPage > 3) ||
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                return isEllipsis ? (
                  <span key={page} className="flex size-8 items-center justify-center text-xs text-muted-foreground">
                    …
                  </span>
                ) : null
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/25 hover:text-foreground"
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

      </div>
    </section>
  )
}
