import { SafeProduct } from "@/lib/validators/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, Star, Heart, Eye } from "lucide-react";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const categoryFallbacks: Record<string, string> = {
  Stationery: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=400&auto=format&fit=crop",
  Medical: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop",
  Laboratory: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop",
  Surgical: "https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=400&auto=format&fit=crop",
  Canteen: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
  Housekeeping: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop",
  Miscellaneous: "https://images.unsplash.com/photo-1603398938378-e54eab446dde?q=80&w=400&auto=format&fit=crop",
};

export function ProductCard({ product }: { product: SafeProduct }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addToCartMutation = useAddToCart();

  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  // 🛒 ADD TO CART (WITH ANIMATION)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setAdding(true);

    addToCartMutation.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          toast.success("Added to cart", {
            description: `${product.name} added.`,
          });

          queryClient.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });

          // 🔥 animation effect
          setTimeout(() => setAdding(false), 300);
        },
        onError: () => {
          toast.error("Login required", {
            description: "Please log in.",
          });
          setAdding(false);
        },
      }
    );
  };

  // ❤️ WISHLIST
  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      await fetch(`${apiUrl}/api/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("yelements_token")}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      setWishlisted(true);

      toast.success("Added to wishlist ❤️");
    } catch {
      toast.error("Login required");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);

  const categoryColors: Record<string, string> = {
    Stationery: "bg-blue-100 text-blue-700",
    Medical: "bg-red-100 text-red-700",
    Laboratory: "bg-purple-100 text-purple-700",
    Surgical: "bg-orange-100 text-orange-700",
    Canteen: "bg-yellow-100 text-yellow-700",
    Housekeeping: "bg-teal-100 text-teal-700",
    Miscellaneous: "bg-gray-100 text-gray-700",
  };

  const catColor =
    categoryColors[product.categoryName ?? ""] ??
    "bg-primary/10 text-primary";

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="bg-gradient-to-b from-white to-slate-50/40 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 active:translate-y-0 transition-all duration-300 ease-out relative overflow-hidden flex flex-col justify-between h-full">
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/0 via-teal-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div>
          {/* ❤️ WISHLIST BUTTON */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow hover:scale-110 active:scale-95 transition text-slate-400 hover:text-rose-500 border border-slate-100"
          >
            <Heart
              className={`w-4 h-4 ${
                wishlisted ? "text-rose-500 fill-rose-500" : ""
              }`}
            />
          </button>

          {/* IMAGE */}
          <div className="relative aspect-square flex items-center justify-center bg-slate-50 overflow-hidden border-b">
            <img
              src={
                !imgError && product.imageUrl 
                  ? product.imageUrl 
                  : (categoryFallbacks[product.categoryName ?? ""] ?? categoryFallbacks.Miscellaneous)
              }
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
            />
            {/* Quick View Eyeball Overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> View Details
              </span>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-3 space-y-1.5">
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block ${catColor}`}>
              {product.categoryName || "Supplies"}
            </span>

            <h3 className="text-xs font-bold leading-tight text-slate-800 line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>

            <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
              {product.description || "Premium institutional equipment."}
            </p>

            {/* ⭐ RATING */}
            <div className="flex items-center gap-1 pt-1">
              <div className="flex text-amber-400">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                ({product.reviewCount || 12})
              </span>
            </div>

            {/* Show created date/time for admin or vendor */}
            {(user?.role === "admin" || user?.role === "vendor") && product.createdAt && (
              <div className="text-[9px] text-emerald-850 font-bold bg-emerald-50/70 rounded-md py-1 px-2 border border-emerald-100/50 mt-1">
                📅 Created: {new Date(product.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            )}
          </div>
        </div>

        {/* PRICE + CART */}
        <div className="p-3 pt-0">
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <div className="space-y-0">
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Price</p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                  <span className="text-slate-400 line-through text-[10px] font-medium">
                    {formatPrice(Number(product.originalPrice))}
                  </span>
                )}
              </div>
            </div>

            <Button
              size="icon"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-white shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 ${
                adding ? "scale-110 bg-emerald-600" : ""
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </Button>
          </div>

          {product.stock === 0 && (
            <p className="text-[10px] text-red-500 font-bold mt-1 text-right">Out of Stock</p>
          )}
        </div>

      </div>
    </Link>
  );
}