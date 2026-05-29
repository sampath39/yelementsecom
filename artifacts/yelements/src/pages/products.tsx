import { AppLayout } from "@/components/layout/app-layout";
import { useGetProducts, useGetCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { normalizeProducts, SafeProduct } from "@/lib/normalizeProduct";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch, Link } from "wouter";

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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sort, setSort] = useState("");

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const { data: categories } = useGetCategories();

  // Parse category & subcategory from URL supporting both numeric IDs and string slugs
  useEffect(() => {
    const params = new URLSearchParams(searchString || "");
    const cat = params.get("category");
    const sub = params.get("subcategory");
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
    setSelectedSubcategory(sub || null);
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
      subcategory: selectedSubcategory || undefined,
      limit: 8,
      page,
      sort: sort || undefined,
    } as any,
    {
      query: {
        queryKey: ["products", categoryId, rawCategorySlug, selectedSubcategory, page, sort],
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

      <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
        
        {/* Mobile/Tablet Category Picker (Horizontal scroll) */}
        <div className="lg:hidden space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => {
                setCategoryId(undefined);
                setSelectedSubcategory(null);
                setPage(1);
                setProducts([]);
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all duration-300 ${
                categoryId === undefined
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100"
              }`}
            >
              All Products 📦
            </button>
            {categories?.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryId(cat.id);
                    setSelectedSubcategory(null);
                    setPage(1);
                    setProducts([]);
                  }}
                  className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all duration-300 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{(cat as any).icon || "📁"}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile subcategories */}
          {categoryId !== undefined && (() => {
            const activeCat = categories?.find((c) => c.id === categoryId);
            const subcats = activeCat?.subcategories || [];
            if (subcats.length === 0) return null;
            return (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none animate-in fade-in slide-in-from-top-1 duration-200">
                {subcats.map((sub) => {
                  const isSubSelected = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubcategory(isSubSelected ? null : sub);
                        setPage(1);
                        setProducts([]);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 flex items-center gap-1 ${
                        isSubSelected
                          ? "bg-teal-600 text-white shadow-md shadow-teal-600/10"
                          : "bg-white border border-slate-100 text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      <span>{sub}</span>
                      {isSubSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Desktop Sidebar (Left side) */}
        <div className="hidden lg:block w-64 shrink-0 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm h-fit space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Directories</span>
              <button 
                onClick={() => {
                  setCategoryId(undefined);
                  setSelectedSubcategory(null);
                  setPage(1);
                  setProducts([]);
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setCategoryId(undefined);
                  setSelectedSubcategory(null);
                  setPage(1);
                  setProducts([]);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-between ${
                  categoryId === undefined
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                    : "bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>All Products</span>
                <span>📦</span>
              </button>

              {categories?.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setSelectedSubcategory(null);
                      setPage(1);
                      setProducts([]);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-[1.02]"
                        : "bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{(cat as any).icon || "📁"}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="opacity-60 font-mono text-[9px] font-bold">➔</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Subcategories */}
          {categoryId !== undefined && (() => {
            const activeCat = categories?.find((c) => c.id === categoryId);
            const subcats = activeCat?.subcategories || [];
            if (subcats.length === 0) return null;
            return (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 block">Subcategories</span>
                <div className="flex flex-col gap-1.5">
                  {subcats.map((sub) => {
                    const isSubSelected = selectedSubcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setSelectedSubcategory(isSubSelected ? null : sub);
                          setPage(1);
                          setProducts([]);
                        }}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-between ${
                          isSubSelected
                            ? "bg-teal-600 text-white shadow-md shadow-teal-600/10 scale-[1.01]"
                            : "bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sub}</span>
                        {isSubSelected && <span className="text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Product Grid & Controls Area */}
        <div className="flex-1 space-y-6">
          {/* Controls Bar */}
          <div className="flex justify-between items-center bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-500">
              Showing {products.length} B2B Catalogue items
            </span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
                setProducts([]);
              }}
              className="border border-slate-200 bg-white p-2 rounded-xl text-xs font-bold outline-none cursor-pointer hover:border-slate-300 transition"
            >
              <option value="">Default Sorting</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
            </select>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Skeleton loader */}
          {isLoading && page === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
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
            <div className="text-center py-16 bg-slate-50 border border-dashed rounded-3xl max-w-sm mx-auto space-y-3">
              <span className="text-2xl">📦</span>
              <p className="text-sm font-bold text-slate-800">No products found in this directory</p>
              <p className="text-xs text-slate-500">Try choosing a different directory or category path.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}