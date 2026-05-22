import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";

export function FloatingCart() {
  const { user } = useAuth();
  const { data: cart } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: !!user,
    },
  });

  if (!cart || cart.itemCount === 0) return null;

  // Assume items is an array in cart, or we calculate total if not provided directly
  const total = cart.items ? cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;

  return (
    <Link href="/cart">
      <div className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 cursor-pointer hover:-translate-y-1 transition-transform">
        <div className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-neon group">
          <div className="relative">
            <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary">
              {cart.itemCount}
            </span>
          </div>
          <div className="flex flex-col items-start pr-2 border-l border-primary-foreground/20 pl-3">
            <span className="text-[10px] uppercase font-bold opacity-80 leading-none">Total</span>
            <span className="text-sm font-black leading-tight">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
