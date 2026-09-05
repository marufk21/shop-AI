"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  ArrowCounterClockwise,
  Package,
  CreditCard,
  Bank,
  Tag,
  Check,
} from "@phosphor-icons/react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

import { useStoreProduct } from "@/hooks/store/use-products"
import { useRecentlyViewed } from "@/hooks/store/use-recently-viewed"
import { useCartState, useCartDispatch } from "@/components/store/cart-provider"
import { RelatedProducts } from "@/components/store/related-products"

import { getProductImageUrl } from "@/lib/image-url"

interface ProductDetailContentProps {
  slug: string
}

export function ProductDetailContent({ slug }: ProductDetailContentProps) {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("features")
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { data: product, isError, isLoading } = useStoreProduct(slug)
  const { items } = useCartState()
  const { addItem, updateQuantity, removeItem, openCart } = useCartDispatch()
  const prefersReducedMotion = useReducedMotion()
  const { addItem: addRecentlyViewed } = useRecentlyViewed()

  const cartItem = items.find((i) => i.productId === product?.id)
  const inCartQuantity = cartItem?.quantity ?? 0
  const isItemInCart = inCartQuantity > 0
  const currentQuantity = isItemInCart ? inCartQuantity : quantity

  useEffect(() => {
    if (product) {
      addRecentlyViewed({
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        imageUrl: product.image_url,
      })
    }
  }, [product, addRecentlyViewed])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-muted sm:aspect-square sm:h-auto" />
          <div className="space-y-4 pt-4">
            <div className="h-4 w-20 animate-pulse rounded-lg bg-muted" />
            <div className="h-8 w-80 animate-pulse rounded-lg bg-muted" />
            <div className="h-6 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <Package className="mx-auto mb-4 size-16 text-muted-foreground/20" />
        <h3 className="font-heading text-lg font-semibold">
          Product not found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This product doesn&apos;t exist or has been removed.
        </p>
        <Button
          className="mt-6 rounded-lg font-semibold"
          render={<Link href="/store">Back to Store</Link>}
        />
      </div>
    )
  }

  const inStock = product.inventory > 0
  const categoryParts = product.category.split(">").map((s) => s.trim())
  const mainCategory = categoryParts[0] ?? product.category

  const handleIncrease = () => {
    if (!product) return
    if (isItemInCart) {
      if (inCartQuantity < product.inventory) {
        updateQuantity(product.id, inCartQuantity + 1)
      }
    } else {
      setQuantity((q) => Math.min(product.inventory, q + 1))
    }
  }

  const handleDecrease = () => {
    if (!product) return
    if (isItemInCart) {
      if (inCartQuantity > 1) {
        updateQuantity(product.id, inCartQuantity - 1)
      } else {
        removeItem(product.id)
        setQuantity(1)
      }
    } else {
      setQuantity((q) => Math.max(1, q - 1))
    }
  }

  const handleAddToCart = () => {
    if (!inStock || !product) return
    if (isItemInCart) {
      openCart()
      return
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url,
      slug: product.slug,
      quantity,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 md:pt-8 pb-6 sm:px-6 md:pb-8">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-12">
        {/* Left: Image */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="self-start lg:sticky lg:top-28"
        >
          <div className="relative h-80 overflow-hidden rounded-xl border border-border/40 bg-white sm:aspect-square sm:h-auto">
            {product.image_url ? (
              <Image
                src={getProductImageUrl(product.image_url, "detail")!}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                fetchPriority="high"
                className="object-contain p-6 sm:p-8"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted/10">
                <Package className="size-24 text-muted-foreground/15" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Right: Details */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Category + Stock */}
          <div className="mb-3 flex items-center gap-3">
            <Badge
              variant="secondary"
              className="h-6 rounded-full px-2.5 text-[10px] font-semibold"
            >
              {mainCategory}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${inStock ? "bg-foreground" : "bg-destructive"}`}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {inStock ? `${product.inventory} in stock` : "Sold out"}
              </span>
            </div>
          </div>

          {/* Name */}
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 text-muted-foreground/30"
                  weight="regular"
                />
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              No reviews yet
            </span>
          </div>

          {/* Price */}
          <div className="mt-5">
            <span className="text-3xl font-bold text-foreground tabular-nums">
              ${product.price.toFixed(2)}
            </span>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              Free delivery
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <Separator className="mt-6" />

          {/* Quantity + Add to Cart */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Quantity
              </span>
              <div className="flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5">
                <button
                  onClick={handleDecrease}
                  aria-label="Decrease quantity"
                  className="flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-background"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="flex size-9 items-center justify-center text-sm font-semibold tabular-nums">
                  {currentQuantity}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={currentQuantity >= product.inventory}
                  aria-label="Increase quantity"
                  className="flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-background disabled:opacity-40"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              {isItemInCart && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="size-3.5" weight="bold" /> In Cart
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={!inStock}
                variant={isItemInCart ? "secondary" : "default"}
                className="h-12 flex-1 cursor-pointer rounded-lg text-sm font-semibold shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="mr-2 size-4.5" weight="fill" />
                {!inStock
                  ? "Out of Stock"
                  : isItemInCart
                    ? "In Cart • View Cart"
                    : "Add to Cart"}
              </Button>
              <Button
                variant="outline"
                size="icon-lg"
                onClick={() => setIsWishlisted((prev) => !prev)}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg"
              >
                <Heart
                  className={`size-5 ${isWishlisted ? "fill-destructive text-destructive" : ""}`}
                  weight={isWishlisted ? "fill" : "regular"}
                />
              </Button>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              { icon: Truck, text: "Free shipping" },
              { icon: ShieldCheck, text: "1 year warranty" },
              { icon: ArrowCounterClockwise, text: "30-day returns" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <item.icon className="size-3.5 text-primary/60" weight="fill" />
                {item.text}
              </div>
            ))}
          </div>

          {/* Offers */}
          <div className="mt-5 space-y-2 rounded-xl border border-border/40 bg-card/50 p-4">
            {[
              {
                icon: CreditCard,
                text: "10% Instant Discount with HDFC Bank cards",
              },
              { icon: Bank, text: "No-Cost EMI starting at $16/month" },
              {
                icon: Tag,
                text: "Extra 5% cashback on first ShopAI Pay order",
              },
            ].map((offer) => (
              <div key={offer.text} className="flex items-start gap-2">
                <offer.icon
                  className="mt-0.5 size-3.5 shrink-0 text-foreground/60"
                  weight="fill"
                />
                <p className="text-xs leading-snug text-muted-foreground">
                  {offer.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-16 max-w-3xl">
        <div className="flex justify-center border-b border-border">
          {["Features", "Specifications", "Reviews"].map((tab) => {
            const key = tab.toLowerCase()
            const active = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative cursor-pointer px-6 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          {activeTab === "features" && (
            <ul className="space-y-2.5">
              {[
                `${product.inventory} units available — ready to ship`,
                `Category: ${mainCategory}`,
                "Premium quality — guaranteed satisfaction",
                "24/7 customer support included with every order",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <Check
                    className="size-4 shrink-0 text-foreground/60"
                    weight="bold"
                  />{" "}
                  {f}
                </li>
              ))}
            </ul>
          )}

          {activeTab === "specifications" && (
            <div className="overflow-hidden rounded-xl border border-border/40">
              {[
                { label: "SKU", value: product.slug },
                { label: "Category", value: mainCategory },
                { label: "Status", value: product.status },
                { label: "Inventory", value: String(product.inventory) },
                {
                  label: "Last Updated",
                  value: new Date(product.updated_at).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  ),
                },
              ].map((spec, i) => (
                <div
                  key={spec.label}
                  className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? "bg-muted/10" : "bg-transparent"}`}
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {spec.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border/50">
                <Star className="size-8 text-muted-foreground/30" weight="regular" />
              </div>
              <h4 className="font-heading text-base font-semibold text-foreground">
                No reviews yet
              </h4>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Be the first to review this product and share your experience with other shoppers.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts category={product.category} currentSlug={product.slug} />
    </div>
    </>
  )
}
