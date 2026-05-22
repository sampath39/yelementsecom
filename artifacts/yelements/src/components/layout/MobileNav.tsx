import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, Package, User } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const { data: cart } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: !!user,
    },
  });

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Grid, label: "Categories", href: "/categories" },
    { icon: ShoppingCart, label: "Cart", href: "/cart", isCart: true },
    { icon: Package, label: "Orders", href: "/orders" },
    { icon: User, label: "Profile", href: user ? "/dashboard" : "/login" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/20 pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? "fill-primary/20" : ""}`} />
                {item.isCart && cart && cart.itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[9px] rounded-full">
                    {cart.itemCount}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
