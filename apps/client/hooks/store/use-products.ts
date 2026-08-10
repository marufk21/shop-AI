import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { ApiError } from "@/server/api-client"
import {
  fetchStoreCategories,
  fetchStoreProduct,
  fetchStoreProducts,
} from "@/server/store/product-fetchers"
import type { ProductListParams } from "@/types/product"

export const storeProductKeys = {
  all: ["store-products"] as const,
  lists: () => [...storeProductKeys.all, "list"] as const,
  list: (params: ProductListParams) =>
    [...storeProductKeys.lists(), params] as const,
  detail: (slug: string) => [...storeProductKeys.all, "detail", slug] as const,
  categories: () => [...storeProductKeys.all, "categories"] as const,
}

export function useStoreProducts(
  params: ProductListParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: storeProductKeys.list(params),
    queryFn: () => fetchStoreProducts(params),
    enabled,
    // Keep the previous page/category visible while the next fetch is in
    // flight instead of flashing a full skeleton.
    placeholderData: keepPreviousData,
  })
}

export function useStoreProduct(slug: string) {
  return useQuery({
    queryKey: storeProductKeys.detail(slug),
    queryFn: () => fetchStoreProduct(slug),
    enabled: slug.length > 0,
    // A missing product won't appear on retry — fail fast on 404.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 404) && failureCount < 1,
  })
}

export function useStoreCategories() {
  return useQuery({
    queryKey: storeProductKeys.categories(),
    queryFn: fetchStoreCategories,
    staleTime: 5 * 60 * 1000,
  })
}
