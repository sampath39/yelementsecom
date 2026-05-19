import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetCategory,
  getGetCategoryQueryKey,
  useGetProducts,
} from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function CategoryDetail() {
  const [, params] = useRoute("/categories/:id");
  const categoryId = params?.id ? parseInt(params.id) : 0;

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // ✅ RESET SUBCATEGORY when category changes
  useEffect(() => {
    setSelectedSubcategory(null);
  }, [categoryId]);

  // ✅ FORCE REFETCH when category changes
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [categoryId, selectedSubcategory]);

  const { data: category, isLoading: loadingCategory } = useGetCategory(categoryId, {
    query: {
      queryKey: getGetCategoryQueryKey(categoryId),
      enabled: !!categoryId,
    },
  });

  const { data: productsData, isLoading: loadingProducts } = useGetProducts(
    {
      categoryId,
      subcategory: selectedSubcategory,
      limit: 50,
    },
    {
      query: {
        enabled: !!categoryId,
        queryKey: ["products", categoryId, selectedSubcategory], // ✅ FIX
      },
    }
  );

  if (loadingCategory) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-1/3 mb-4" />
          <Skeleton className="h-4 w-1/4 mb-12" />
        </div>
      </AppLayout>
    );
  }

  if (!category) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Category not found</h2>
          <Button asChild className="mt-4">
            <Link href="/categories">Back</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="bg-muted/30 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm mb-4">
            <Link href="/">Home</Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span>{category.name}</span>
          </div>

          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-64">
          <button onClick={() => setSelectedSubcategory(null)}>
            All
          </button>

          {category.subcategories?.map((sub) => (
            <button key={sub} onClick={() => setSelectedSubcategory(sub)}>
              {sub}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1">
          {loadingProducts ? (
            <div>Loading...</div>
          ) : productsData?.products?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {productsData.products.map((product) => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div>No products found</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}