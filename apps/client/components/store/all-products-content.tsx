import { ProductsSection } from "@/components/store/home/products-section"

export function AllProductsContent({
  initialSearch = "",
}: {
  initialSearch?: string
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 md:py-8">
      <ProductsSection initialSearch={initialSearch} />
    </div>
  )
}
