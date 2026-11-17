import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { myOrderKeys } from "@/hooks/store/use-orders"
import {
  fetchAdminOrders,
  type AdminOrderListParams,
  updateAdminOrder,
} from "@/server/admin/order-fetchers"
import type { OrderListResponse, UpdateOrderInput } from "@/types/order"

const updateOrderKey = ["update-admin-order"] as const

export function usePendingAdminOrderIds() {
  return useMutationState({
    filters: { mutationKey: updateOrderKey, status: "pending" },
    select: (mutation) =>
      (mutation.state.variables as { orderId: string }).orderId,
  })
}

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  list: (params: AdminOrderListParams) =>
    [...adminOrderKeys.all, "list", params] as const,
}

export function useAdminOrders(params: AdminOrderListParams = {}) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => fetchAdminOrders(params),
  })
}

export function useUpdateAdminOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: updateOrderKey,
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string
      payload: UpdateOrderInput
    }) => updateAdminOrder(orderId, payload),
    onSuccess: (updated) => {
      for (const [key, data] of queryClient.getQueriesData<OrderListResponse>({
        queryKey: adminOrderKeys.all,
      })) {
        if (!data?.items.some((order) => order.id === updated.id)) continue

        const params = key[2] as AdminOrderListParams
        const matchesStatus = !params.status || params.status === updated.status
        queryClient.setQueryData<OrderListResponse>(key, {
          ...data,
          items: matchesStatus
            ? data.items.map((order) =>
                order.id === updated.id ? updated : order
              )
            : data.items.filter((order) => order.id !== updated.id),
          total: matchesStatus ? data.total : Math.max(0, data.total - 1),
        })
      }
      queryClient.setQueriesData<OrderListResponse>(
        { queryKey: myOrderKeys.all },
        (data) =>
          data
            ? {
                ...data,
                items: data.items.map((order) =>
                  order.id === updated.id ? updated : order
                ),
              }
            : data
      )
      // Reconcile filtered lists when they are next opened without reloading this table.
      void queryClient.invalidateQueries({
        queryKey: adminOrderKeys.all,
        refetchType: "none",
      })
      void queryClient.invalidateQueries({
        queryKey: myOrderKeys.all,
        refetchType: "none",
      })
    },
  })
}
