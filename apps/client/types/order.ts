export interface CreateOrderItem {
  product_id: string
  quantity: number
}

export interface ShippingAddress {
  full_name: string
  email: string
  phone: string
  address_line1: string
  address_line2?: string | null
  city: string
  state: string
  postal_code: string
  country: string
}

export type OrderStatus =
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "pending_payment"

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
  product_name: string | null
  product_image_url: string | null
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  subtotal: number
  shipping_fee: number
  total: number
  shipping_full_name: string | null
  shipping_email: string | null
  shipping_phone: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_postal_code: string | null
  shipping_country: string | null
  tracking_number: string | null
  admin_note: string | null
  customer_email: string | null
  customer_name: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface OrderListResponse {
  items: Order[]
  total: number
}

export interface UpdateOrderInput {
  status?: Exclude<OrderStatus, "pending_payment">
  tracking_number?: string | null
  admin_note?: string | null
}
