import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { notFound } from "next/navigation"

import { getQueryClient } from "@/lib/query-client"
import { storeProductKeys } from "@/hooks/store/use-products"
import { ApiError } from "@/server/api-client"
import {
  fetchStoreProduct,
  fetchStoreProducts,
} from "@/server/store/product-fetchers"
import { ProductDetailContent } from "@/components/store/product-detail-content"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const queryClient = getQueryClient()

  try {
    const product = await queryClient.fetchQuery({
      queryKey: storeProductKeys.detail(slug),
      queryFn: () => fetchStoreProduct(slug),
    })

    if (product?.category) {
      // Don't await: dehydrate() ships pending queries to the client, so this
      // must not delay first paint when the backend is slow/cold-starting.
      void queryClient.prefetchQuery({
        queryKey: storeProductKeys.list({
          category: product.category,
          limit: 24,
        }),
        queryFn: () =>
          fetchStoreProducts({ category: product.category, limit: 24 }),
      })
    }
  } catch (error) {
    // Unknown slug — render the 404 page instead of a shell that refetches.
    if (error instanceof ApiError && error.status === 404) {
      notFound()
    }
    // Other failures — client hooks will fetch on mount.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailContent slug={slug} />
    </HydrationBoundary>
  )
}
