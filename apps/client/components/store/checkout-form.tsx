"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CircleNotch, Package, ShieldCheck } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ApiError, apiClient } from "@/server/api-client"
import type { CreateOrderItem, Order, ShippingAddress } from "@/types/order"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const checkoutSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the recipient's name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(320),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40),
  address_line1: z.string().trim().min(3, "Enter your street address").max(255),
  address_line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "Enter your city").max(120),
  state: z.string().trim().min(2, "Enter your state or region").max(120),
  postal_code: z.string().trim().min(2, "Enter your postal code").max(40),
  country: z.string().trim().min(2, "Enter your country").max(120),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

interface CheckoutFormProps {
  items: CreateOrderItem[]
  email?: string | null
  onBack: () => void
  onCompleted: (order: Order) => void
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null
}

export function CheckoutForm({
  items,
  email,
  onBack,
  onCompleted,
}: CheckoutFormProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: "",
      email: email ?? "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
    },
  })

  async function onSubmit(values: CheckoutValues) {
    try {
      setSubmitError(null)
      const shipping_address: ShippingAddress = {
        ...values,
        address_line2: values.address_line2 || null,
      }
      const order = await apiClient.post<Order>("/api/v1/orders", {
        items,
        shipping_address,
      })
      onCompleted(order)
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "We could not place your order. Please try again."
      )
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="rounded-lg"
          aria-label="Back to cart"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="font-heading text-base font-semibold">Delivery details</h2>
          <p className="text-xs text-muted-foreground">No online payment is required.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-4" weight="fill" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Place your order now. Our team will confirm it and arrange payment or cash on delivery directly with you.
            </p>
          </div>

          {submitError ? (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {submitError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-full-name">Full name</Label>
              <Input id="checkout-full-name" autoComplete="name" {...form.register("full_name")} />
              <FieldError message={form.formState.errors.full_name?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-email">Email</Label>
                <Input id="checkout-email" type="email" autoComplete="email" {...form.register("email")} />
                <FieldError message={form.formState.errors.email?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-phone">Phone</Label>
                <Input id="checkout-phone" type="tel" autoComplete="tel" {...form.register("phone")} />
                <FieldError message={form.formState.errors.phone?.message} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-address-1">Address line 1</Label>
              <Input id="checkout-address-1" autoComplete="address-line1" {...form.register("address_line1")} />
              <FieldError message={form.formState.errors.address_line1?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="checkout-address-2">Address line 2 <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="checkout-address-2" autoComplete="address-line2" {...form.register("address_line2")} />
              <FieldError message={form.formState.errors.address_line2?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-city">City</Label>
                <Input id="checkout-city" autoComplete="address-level2" {...form.register("city")} />
                <FieldError message={form.formState.errors.city?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-state">State / region</Label>
                <Input id="checkout-state" autoComplete="address-level1" {...form.register("state")} />
                <FieldError message={form.formState.errors.state?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="checkout-postal-code">Postal code</Label>
                <Input id="checkout-postal-code" autoComplete="postal-code" {...form.register("postal_code")} />
                <FieldError message={form.formState.errors.postal_code?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-country">Country</Label>
                <Input id="checkout-country" autoComplete="country-name" {...form.register("country")} />
                <FieldError message={form.formState.errors.country?.message} />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-muted/10 px-6 py-4">
          <Button type="submit" className="h-11 w-full rounded-lg font-semibold" disabled={isSubmitting}>
            {isSubmitting ? <CircleNotch className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" weight="fill" />}
            {isSubmitting ? "Placing order..." : "Place order"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">No payment will be collected online.</p>
        </div>
      </form>
    </div>
  )
}
