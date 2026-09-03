export interface CreateOrderItem {
  product_id: string
  quantity: number
}

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface Order {
  id: string
  user_id: string
  status: "pending_payment"
  subtotal: number
  total: number
  created_at: string
  updated_at: string
  items: OrderItem[]
}
