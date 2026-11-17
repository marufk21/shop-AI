"use client"

import * as React from "react"
import { Eye, Package, Truck } from "@phosphor-icons/react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"

import { DataTable } from "@/components/shared/data-table"
import {
  useAdminOrders,
  usePendingAdminOrderIds,
  useUpdateAdminOrder,
} from "@/hooks/admin/use-orders"
import { formatCurrency } from "@/lib/format-currency"
import type { Order, OrderStatus, UpdateOrderInput } from "@/types/order"

type ManageableStatus = Exclude<OrderStatus, "pending_payment">

const manageableStatuses: ManageableStatus[] = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]

const statusLabels: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending_payment: "Pending payment",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function orderReference(order: Order) {
  return `#${order.id.slice(-8).toUpperCase()}`
}

function addressLines(order: Order) {
  return [
    order.shipping_full_name,
    order.shipping_address_line1,
    order.shipping_address_line2,
    [order.shipping_city, order.shipping_state, order.shipping_postal_code]
      .filter(Boolean)
      .join(", "),
    order.shipping_country,
  ].filter(Boolean)
}

export function OrdersContent() {
  const [status, setStatus] = React.useState<"all" | OrderStatus>("all")
  const [search, setSearch] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const updateOrder = useUpdateAdminOrder()
  const pendingOrderIds = usePendingAdminOrderIds()
  const { data, isError, isLoading } = useAdminOrders({
    status: status === "all" ? undefined : status,
    search: search || undefined,
    limit: 100,
  })

  const orders = data?.items ?? []
  const columns = [
    {
      key: "id",
      header: "Order",
      sortable: true,
      cell: (order: Order) => (
        <div>
          <p className="font-mono text-xs font-semibold">
            {orderReference(order)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(order.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "customer_email",
      header: "Customer",
      sortable: true,
      cell: (order: Order) => (
        <div className="min-w-36">
          <p className="text-sm font-medium">
            {order.shipping_full_name || order.customer_name || "Customer"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {order.shipping_email || order.customer_email}
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (order: Order) => (
        <span className="text-sm text-muted-foreground">
          {order.items.reduce((total, item) => total + item.quantity, 0)} item
          {order.items.length === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      cell: (order: Order) => (
        <span className="font-medium">{formatCurrency(order.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (order: Order) => (
        <div className="space-y-1">
          <Select
            value={order.status}
            disabled={
              order.status === "cancelled" || pendingOrderIds.includes(order.id)
            }
            onValueChange={(value) => {
              if (
                manageableStatuses.includes(value as ManageableStatus) &&
                value !== order.status
              ) {
                void changeOrderStatus(order, value as ManageableStatus)
              }
            }}
          >
            <SelectTrigger
              className="w-36"
              aria-label={`Status for ${orderReference(order)}`}
            >
              <SelectValue>{statusLabels[order.status]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {manageableStatuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {statusLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pendingOrderIds.includes(order.id) ? (
            <p className="text-xs text-muted-foreground" role="status">
              Saving...
            </p>
          ) : null}
        </div>
      ),
    },
  ]

  async function changeOrderStatus(order: Order, status: ManageableStatus) {
    try {
      const updated = await updateOrder.mutateAsync({
        orderId: order.id,
        payload: { status },
      })
      setSelectedOrder((current) =>
        current?.id === updated.id ? updated : current
      )
      toast.success(`Order status updated to ${statusLabels[updated.status]}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update order status"
      )
    }
  }

  async function saveOrder(payload: UpdateOrderInput) {
    if (!selectedOrder) return
    try {
      const updated = await updateOrder.mutateAsync({
        orderId: selectedOrder.id,
        payload,
      })
      setSelectedOrder(updated)
      toast.success("Order updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the order"
      )
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Review delivery details and fulfil customer orders.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <Package className="size-3.5" weight="fill" />
          {data?.total ?? 0} total orders
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Filter:
        </span>
        {(["all", ...manageableStatuses] as const).map((value) => (
          <Button
            key={value}
            type="button"
            size="xs"
            variant={status === value ? "default" : "outline"}
            onClick={() => setStatus(value)}
            className="capitalize"
          >
            {value === "all" ? "All orders" : statusLabels[value]}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search order, customer, or tracking number..."
        rowKey={(order) => order.id}
        emptyMessage={
          isError ? "Could not load orders." : "No orders match this view."
        }
        actions={(order) => (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Manage ${orderReference(order)}`}
            onClick={() => setSelectedOrder(order)}
          >
            <Eye className="size-4" />
          </Button>
        )}
      />

      <OrderDetailsDialog
        order={selectedOrder}
        isSaving={Boolean(
          selectedOrder && pendingOrderIds.includes(selectedOrder.id)
        )}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onSave={saveOrder}
      />
    </>
  )
}

function OrderDetailsDialog({
  order,
  isSaving,
  onOpenChange,
  onSave,
}: {
  order: Order | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSave: (payload: UpdateOrderInput) => Promise<void>
}) {
  const [nextStatus, setNextStatus] =
    React.useState<UpdateOrderInput["status"]>("confirmed")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [adminNote, setAdminNote] = React.useState("")

  React.useEffect(() => {
    if (order) {
      setNextStatus(
        order.status === "pending_payment" ? "confirmed" : order.status
      )
      setTrackingNumber(order.tracking_number ?? "")
      setAdminNote(order.admin_note ?? "")
    }
  }, [order])

  if (!order) return null

  const address = addressLines(order)
  const canEdit = order.status !== "cancelled"

  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Truck className="size-5 text-primary" weight="fill" />
            {orderReference(order)}
          </DialogTitle>
          <DialogDescription>
            Placed {formatDate(order.created_at)} ·{" "}
            {formatCurrency(order.total)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="space-y-2 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Delivery address</h3>
            {address.length ? (
              <address className="text-sm leading-relaxed text-muted-foreground not-italic">
                {address.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">
                No delivery address is available for this legacy order.
              </p>
            )}
            <p className="pt-1 text-xs text-muted-foreground">
              {order.shipping_phone || "No phone number"}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.shipping_email || order.customer_email}
            </p>
          </section>

          <section className="space-y-2 rounded-xl border p-4">
            <h3 className="text-sm font-semibold">Order summary</h3>
            <div className="space-y-2 text-sm">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 text-muted-foreground"
                >
                  <span className="min-w-0 truncate">
                    {item.product_name || "Product"} × {item.quantity}
                  </span>
                  <span className="shrink-0">
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {order.shipping_fee
                    ? formatCurrency(order.shipping_fee)
                    : "Free"}
                </span>
              </div>
              <div className="mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="order-status">Order status</Label>
            <Select
              value={nextStatus}
              onValueChange={(value) =>
                setNextStatus(value as UpdateOrderInput["status"])
              }
              disabled={!canEdit}
            >
              <SelectTrigger id="order-status" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {manageableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tracking-number">Tracking number</Label>
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              disabled={!canEdit}
              placeholder="Optional tracking reference"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-note">Internal note</Label>
          <Textarea
            id="admin-note"
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            disabled={!canEdit}
            placeholder="Visible only to the admin team"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {canEdit ? (
            <Button
              type="button"
              disabled={isSaving}
              onClick={() =>
                void onSave({
                  status: nextStatus,
                  tracking_number: trackingNumber.trim() || null,
                  admin_note: adminNote.trim() || null,
                })
              }
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
