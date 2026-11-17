import { apiClient } from "@/server/api-client"
import type { Order, OrderListResponse, OrderStatus, UpdateOrderInput } from "@/types/order"

export interface AdminOrderListParams {
  status?: OrderStatus
  search?: string
  skip?: number
  limit?: number
}

export function fetchAdminOrders(params: AdminOrderListParams = {}) {
  return apiClient.get<OrderListResponse>("/api/v1/admin/orders", {
    params: params as Record<string, string | number | boolean | undefined>,
  })
}

export function updateAdminOrder(orderId: string, payload: UpdateOrderInput) {
  return apiClient.patch<Order>(`/api/v1/admin/orders/${orderId}`, payload)
}
