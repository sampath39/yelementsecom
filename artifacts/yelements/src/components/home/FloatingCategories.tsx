import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories, getGetCategoriesQueryKey } from "@workspace/api-client-react";

export function FloatingCategories() {
  const { data: categories, isLoading } = useGetCategories({
    query: { queryKey: getGetCategoriesQueryKey() },
  });

  const categoryIcons: Record<string, string> = {
    Stationery: "✏️",
    Medical: "🏥",
    Laboratory: "🔬",
    Surgical: "🩺",
    Canteen: "🍽️",
    Housekeeping: "🧹",
    Miscellaneous: "📦"
  };

  return (
    <section className="py-8 container mx-auto px-4 lg:px-8 overflow-hidden">
      <div className="flex overflow-x-auto pb-6 pt-4 gap-6 no-scrollbar snap-x cursor-grab active:cursor-grabbing">
        {isLoading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="w-16 h-3 rounded-full" />
              </div>
            ))
          : Array.isArray(categories) && categories.map((category) => {
              const icon = categoryIcons[category.name] ?? "🛍️";
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group flex flex-col items-center gap-3 shrink-0 snap-start"
                >
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-background border border-primary/20 shadow-md flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-neon group-hover:border-primary">
                    <div className="absolute inset-0 bg-primary/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-10 h-10 md:w-12 md:h-12 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span className="text-3xl md:text-4xl relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {icon}
                      </span>
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
