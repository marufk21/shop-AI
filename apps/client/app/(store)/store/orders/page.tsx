"use client"

import { Package, SignIn, Truck } from "@phosphor-icons/react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { useAuth } from "@/components/auth/auth-provider"
import { useMyOrders } from "@/hooks/store/use-orders"
import { formatCurrency } from "@/lib/format-currency"
import type { Order, OrderStatus } from "@/types/order"

const stages = ["confirmed", "processing", "shipped", "delivered"] as const
const stageLabels = ["Confirmed", "Processing", "Shipped", "Delivered"] as const

const statusLabels: Record<OrderStatus, string> = {
  confirmed: "Order confirmed",
  processing: "Preparing your order",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending_payment: "Order received",
}

const statusVariant: Record<
  OrderStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  confirmed: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "outline",
  cancelled: "destructive",
  pending_payment: "secondary",
}

function orderReference(order: Order) {
  return `#${order.id.slice(-8).toUpperCase()}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))
}

function TrackingTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        This order was cancelled. Contact support if you need help.
      </p>
    )
  }

  const activeIndex =
    status === "pending_payment" ? 0 : Math.max(0, stages.indexOf(status))

  return (
    <ol className="grid grid-cols-4 gap-1 pt-1">
      {stages.map((stage, index) => {
        const isReached = index <= activeIndex
        return (
          <li key={stage} className="min-w-0">
            <div className="flex items-center">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  isReached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {index + 1}
              </span>
              {index < stages.length - 1 ? (
                <span className={`h-0.5 flex-1 ${index < activeIndex ? "bg-primary" : "bg-border"}`} />
              ) : null}
            </div>
            <p className={`mt-1.5 pr-1 text-[10px] leading-tight ${isReached ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {stageLabels[index]}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function OrderCard({ order }: { order: Order }) {
  const productSummary = order.items
    .map((item) => `${item.product_name || "Product"} × ${item.quantity}`)
    .join(", ")

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold">{orderReference(order)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Placed on {formatDate(order.created_at)}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
            <Badge variant={statusVariant[order.status]}>{statusLabels[order.status]}</Badge>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <p className="text-sm font-medium">{productSummary}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Delivering to {order.shipping_city || "your saved address"}
              {order.shipping_state ? `, ${order.shipping_state}` : ""}
            </p>
            <div className="mt-5">
              <TrackingTimeline status={order.status} />
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Truck className="size-4 text-primary" weight="fill" />
              Delivery tracking
            </div>
            {order.status === "shipped" || order.status === "delivered" ? (
              order.tracking_number ? (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Tracking number</p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold">{order.tracking_number}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Your shipment is being tracked. The tracking reference will appear here once assigned.
                </p>
              )
            ) : (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Tracking details will appear here after your order is shipped.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyOrdersPage() {
  const { status, openAuthModal } = useAuth()
  const { data, isError, isLoading } = useMyOrders(status === "authenticated")

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-7">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Check your order status and delivery tracking.</p>
      </div>

      {status === "loading" || isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : status !== "authenticated" ? (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Package className="size-7" weight="fill" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">Sign in to track orders</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Use the account you checked out with to see your delivery updates and tracking references.</p>
            <Button className="mt-5" onClick={() => openAuthModal("account", "signin")}>
              <SignIn className="mr-2 size-4" />
              Sign in
            </Button>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">We could not load your orders right now. Please refresh and try again.</CardContent>
        </Card>
      ) : data?.items.length ? (
        <div className="space-y-4">
          {data.items.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Package className="size-7" weight="fill" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">No orders yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Orders you place will appear here with their delivery updates.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
