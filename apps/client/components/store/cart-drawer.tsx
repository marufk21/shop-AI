"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { toast } from "sonner"
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash,
  ArrowRight,
  Package,
} from "@phosphor-icons/react"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { useCart } from "@/components/store/cart-provider"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/components/auth/auth-provider"
import { getProductImageUrl } from "@/lib/image-url"
import { ApiError, apiClient } from "@/server/api-client"
import type { Order } from "@/types/order"

export function CartDrawer() {
  const {
    items,
    isOpen,
    itemCount,
    subtotal,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart()
  const { consumeIntent, openAuthModal, status } = useAuth()
  const [isCheckingOut, setIsCheckingOut] = React.useState(false)

  const prefersReducedMotion = useReducedMotion()

  const shippingThreshold = 50
  const standardShippingFee = 5.99
  const shippingProgress = Math.min((subtotal / shippingThreshold) * 100, 100)
  const freeShipping = subtotal >= shippingThreshold
  const shippingFee = freeShipping ? 0 : standardShippingFee
  const total = subtotal + shippingFee

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const checkoutItems = React.useMemo(
    () =>
      items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
      })),
    [items]
  )

  async function submitCheckout() {
    if (checkoutItems.length === 0) {
      return
    }

    try {
      setIsCheckingOut(true)
      const order = await apiClient.post<Order>("/api/orders", { items: checkoutItems })
      clearCart()
      closeCart()
      toast.success(`Order ${order.id.slice(0, 8)} created`, {
        description: "Your order is pending payment.",
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        openAuthModal("checkout", "signin")
        return
      }
      toast.error(
        error instanceof ApiError ? error.message : "Unable to complete checkout"
      )
    } finally {
      setIsCheckingOut(false)
    }
  }

  async function handleAuthenticated() {
    if (consumeIntent() === "checkout") {
      await submitCheckout()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.div
            initial={prefersReducedMotion ? {} : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl border-l flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingBag className="size-4.5 text-primary" weight="fill" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">
                    Your Cart
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={closeCart}
                aria-label="Close cart"
                className="rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4.5" />
              </Button>
            </div>

            {/* Free shipping progress */}
            <div className="px-6 py-4 border-b bg-muted/20">
              {freeShipping ? (
                <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    <Package className="size-4" weight="fill" />
                  </div>
                  You qualify for free shipping!
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Free shipping at ${shippingThreshold}
                    </span>
                    <span className="font-semibold text-foreground">
                      ${(shippingThreshold - subtotal).toFixed(2)} away
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={prefersReducedMotion ? {} : { width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-5">
                    <ShoppingBag className="size-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                    Looks like you haven&apos;t added anything yet. Browse our
                    products and find something you love.
                  </p>
                  <Button
                    onClick={closeCart}
                    className="mt-6 rounded-lg font-semibold cursor-pointer"
                  >
                    Continue Shopping
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex gap-4 rounded-xl border bg-card p-3"
                    >
                      {/* Product image */}
                      <Link
                        href={`/store/${item.slug}`}
                        onClick={closeCart}
                        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted border"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={getProductImageUrl(item.imageUrl, "thumb")!}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="size-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </Link>

                      {/* Item details */}
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <Link
                            href={`/store/${item.slug}`}
                            onClick={closeCart}
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm font-bold text-primary mt-0.5">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="flex size-7 items-center justify-center rounded-md hover:bg-background transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="flex size-7 items-center justify-center text-xs font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="flex size-7 items-center justify-center rounded-md hover:bg-background transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t bg-muted/10 px-6 py-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {freeShipping ? (
                        <span className="text-muted-foreground">Free</span>
                      ) : (
                        `$${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <Button
                  className="w-full h-11 rounded-lg font-semibold cursor-pointer text-sm shadow-lg shadow-primary/20"
                  onClick={() => void submitCheckout()}
                  disabled={isCheckingOut || status === "loading"}
                >
                  {isCheckingOut ? "Processing..." : "Checkout"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  30-day easy returns
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
      <AuthModal onAuthenticated={() => void handleAuthenticated()} />
    </AnimatePresence>
  )
}
