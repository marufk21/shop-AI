import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { getQueryClient } from "@/lib/query-client"
import { storeProductKeys } from "@/hooks/store/use-products"
import { fetchStoreProducts } from "@/server/store/product-fetchers"
import { AllProductsContent } from "@/components/store/all-products-content"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const queryClient = getQueryClient()

  try {
    await queryClient.prefetchQuery({
      queryKey: storeProductKeys.list({ limit: 200 }),
      queryFn: () => fetchStoreProducts({ limit: 200 }),
    })
  } catch {
    // Prefetch failed
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllProductsContent initialSearch={q ?? ""} />
    </HydrationBoundary>
  )
}
