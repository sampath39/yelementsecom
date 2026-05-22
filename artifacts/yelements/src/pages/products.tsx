import { AppLayout } from "@/components/layout/app-layout";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { normalizeProducts, SafeProduct } from "@/lib/normalizeProduct";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";

// API response type
interface ProductsResponse {
  products: any[];
  total: number;
  hasMore: boolean;
}

export default function Products() {
  const [location] = useLocation();
  const searchString = useSearch();

  const [products, setProducts] = useState<SafeProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [sort, setSort] = useState("");

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const { data: categories } = useGetCategories();

  // Parse category from URL supporting both numeric IDs and string slugs
  useEffect(() => {
    const params = new URLSearchParams(searchString || "");
    const cat = params.get("category");
    if (!cat) {
      setCategoryId(undefined);
    } else if (!isNaN(Number(cat))) {
      setCategoryId(Number(cat));
    } else if (categories) {
      const found = categories.find(
        (c) =>
          c.slug.toLowerCase() === cat.toLowerCase() ||
          c.name.toLowerCase() === cat.toLowerCase()
      );
      setCategoryId(found ? found.id : undefined);
    }
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [searchString, categories]);

  // API call (infinite scroll & sorting)
  const params = new URLSearchParams(searchString || "");
  const rawCategorySlug = params.get("category") || undefined;

  const { data, isLoading } = useGetProducts(
    {
      categoryId,
      category: !categoryId ? rawCategorySlug : undefined,
      limit: 8,
      page,
      sort: sort || undefined,
    } as any,
    {
      query: {
        queryKey: ["products", categoryId, rawCategorySlug, page, sort],
      },
    }
  ) as { data: ProductsResponse | undefined; isLoading: boolean };

  // Normalize + merge products
  useEffect(() => {
    if (!data?.products) return;
    const normalized = normalizeProducts(data.products);
    setProducts((prev) => {
      if (page === 1) return normalized;
      const ids = new Set(prev.map((p) => p.id));
      const newItems = normalized.filter((p) => !ids.has(p.id));
      return [...prev, ...newItems];
    });
    setHasMore(data.hasMore ?? false);
    setIsLoadingMore(false);
  }, [data, page]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "150px" }
    );
    const el = loaderRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoading, isLoadingMore]);

  return (
    <AppLayout>
      {/* Premium Products Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-12 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
              High-Precision Catalogue
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Explore Our <span className="text-teal-400">Institutional Supplies</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-md">
              Browse ISO-certified laboratory glassware, diagnostics equipment, surgical instruments, and premium school & office stationery.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xl font-black text-teal-400">100%</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Certified Quality</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-xl font-black text-indigo-400">24Hr</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Priority Delivery</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Sort dropdown */}
        <div className="mb-4">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
              setProducts([]);
            }}
            className="border p-2 rounded"
          >
            <option value="">Sort</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
          </select>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {/* Skeleton loader */}
        {isLoading && page === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
          </div>
        )}

        {/* Infinite scroll spinner */}
        {hasMore && (
          <div ref={loaderRef} className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-b-2 border-green-600" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <p className="text-center mt-10 text-gray-500">
            No products found
          </p>
        )}
      </div>
    </AppLayout>
  );
}