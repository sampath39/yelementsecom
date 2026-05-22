import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  Heart,
  Package,
  LogOut,
  Settings,
  LayoutDashboard,
  Store,
  Mic,
  Camera,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: cart } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: !!user, // Only fetch cart if logged in
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const trendingSearches = ["Wireless Earbuds", "Smart Watches", "Sneakers", "Gaming Mouse"];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-400 bg-emerald-500 text-white transition-all duration-300 shadow-md">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 lg:w-1/4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden hover:bg-primary/20">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] glass">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium hover:text-primary">Home</Link>
                  <Link href="/products" className="text-lg font-medium hover:text-primary">All Products</Link>
                  <Link href="/categories" className="text-lg font-medium hover:text-primary">Shop by Category</Link>
                  <Link href="/wishlist" className="text-lg font-medium flex items-center gap-2 hover:text-primary">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Wishlist
                  </Link>
                  <Link href="/about" className="text-lg font-medium hover:text-primary">About Us</Link>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="text-lg font-medium hover:text-primary">My Account</Link>
                      <Link href="/orders" className="text-lg font-medium hover:text-primary">My Orders</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-lg font-medium hover:text-primary">Login</Link>
                      <Link href="/register" className="text-lg font-medium hover:text-primary">Register</Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight flex items-center">
                <span className="text-emerald-100 group-hover:drop-shadow-neon transition-all duration-300">ye</span>
                <span className="text-white">lements</span>
              </span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch} className="relative w-full flex items-center">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-full pl-4 pr-24 bg-background/50 border-primary/20 focus-visible:ring-primary h-11 transition-all duration-300 backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <Button type="button" onClick={() => toast.success("Voice Search Activated", { description: "Listening for your query..." })} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button type="button" onClick={() => toast.success("Camera Search Activated", { description: "Opening camera for visual search..." })} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                  <Camera className="h-4 w-4" />
                </Button>
                <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Trending Searches Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl glass shadow-xl z-50 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground mb-3">
                  <TrendingUp className="h-4 w-4" /> Trending Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((term) => (
                    <Badge 
                      key={term} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 rounded-full"
                      onClick={() => {
                        setSearchQuery(term);
                        setLocation(`/products?search=${encodeURIComponent(term)}`);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 lg:gap-4 lg:w-1/4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hidden sm:flex items-center gap-2 font-semibold">
                    <User className="h-5 w-5 text-emerald-100" />
                    <span className="truncate max-w-[100px]">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center hover:bg-primary/10">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center text-primary font-bold hover:bg-primary/10">
                        <Settings className="mr-2 h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "vendor" && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor" className="cursor-pointer flex items-center text-primary font-bold hover:bg-primary/10">
                        <Store className="mr-2 h-4 w-4" /> Vendor Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-semibold" onClick={() => {
                    logout();
                    setLocation("/");
                  }}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild className="text-foreground hover:bg-primary/20 font-semibold">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {user && (
              <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20" title="My Orders">
                <Link href="/dashboard">
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" asChild className="text-white hover:bg-white/20 relative group">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                {cart && cart.itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-emerald-500 animate-in zoom-in">
                    {cart.itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Mobile Search - Visible only on small screens */}
        <div className="pb-3 lg:hidden">
          <form onSubmit={handleSearch} className="relative w-full flex">
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-r-none bg-background/50 text-foreground h-10 border-primary/20 focus-visible:ring-primary backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Desktop Top Navigation (Replaces Sidebar) */}
      <div className="hidden lg:block border-t border-emerald-400 bg-emerald-600/50 backdrop-blur-md">
        <nav className="container mx-auto px-4 lg:px-8 flex items-center gap-8 h-10">
          <Link href="/" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors">Home</Link>
          <Link href="/products" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors">Products</Link>
          <Link href="/categories" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors">Categories</Link>
          <Link href="/wishlist" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors flex items-center gap-1.5 group">
            <Heart className="w-3.5 h-3.5 text-rose-300 fill-transparent group-hover:fill-rose-300 transition-all" /> Wishlist
          </Link>
          {user && <Link href="/orders" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors">Orders</Link>}
          <Link href="/about" className="text-sm font-semibold text-emerald-50 hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}
