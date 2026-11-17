import { useQuery } from "@tanstack/react-query"

import { fetchMyOrders } from "@/server/store/order-fetchers"

export const myOrderKeys = {
  all: ["my-orders"] as const,
}

export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: myOrderKeys.all,
    queryFn: fetchMyOrders,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}
