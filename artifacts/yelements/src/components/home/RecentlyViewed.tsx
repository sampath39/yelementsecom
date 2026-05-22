import { Clock } from "lucide-react";
import { Link } from "wouter";
import { ProductCard } from "@/components/product-card";
import { useGetProducts, getGetProductsQueryKey } from "@workspace/api-client-react";

export function RecentlyViewed() {
  // Mocking recently viewed by fetching random products for now
  // In a real app, we'd fetch this from localStorage or backend
  const { data: products } = useGetProducts(
    { limit: 4 },
    { query: { queryKey: getGetProductsQueryKey({ limit: 4 }) } }
  );

  if (!products || !Array.isArray(products) || products.length === 0) return null;

  return (
    <section className="py-12 bg-background border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
            <Clock className="w-6 h-6 text-primary" />
            Recently Viewed
          </h2>
          <Link href="/products" className="text-sm font-bold text-primary hover:underline">
            View All History
          </Link>
        </div>

        <div className="flex overflow-x-auto pb-6 gap-4 no-scrollbar snap-x">
          {products.map((product) => (
            <div key={product.id} className="min-w-[240px] md:min-w-[280px] shrink-0 snap-start">
              <ProductCard product={product as any} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
