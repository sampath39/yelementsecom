import { AppLayout } from "@/components/layout/app-layout";
import { useGetCategories, getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const { data: categories, isLoading } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() }
  });

  return (
    <AppLayout>
      {/* Premium Categories Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
            Complete Procurement Scope
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Institutional <span className="text-indigo-400">Product Categories</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Navigate through our expertly segmented inventory directories. Find everything from sterile surgical instruments to high-volume kitchen and housekeeping restocks.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))
          ) : (
            categories?.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`} className="group block">
                <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-100 rounded-3xl p-6 text-center hover:shadow-xl hover:-translate-y-1.5 active:translate-y-0 transition-all duration-300 h-full flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-50/50 border flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 overflow-hidden relative">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-10 h-10 text-indigo-600/60" />
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-800 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {category.description || `High-quality ${category.name} supplies.`}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    Explore →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
