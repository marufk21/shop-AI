import { apiClient } from "@/server/api-client"
import type { OrderListResponse } from "@/types/order"

export function fetchMyOrders() {
  return apiClient.get<OrderListResponse>("/api/v1/orders/mine")
}
