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

export function Header() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-emerald-250/30 text-slate-800 shadow-sm"
      style={{
        backgroundColor: '#d3d3d3',
        backgroundImage: 'linear-gradient(315deg, #d3d3d3 0%, #2bc96d 74%)'
      }}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 lg:w-1/4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-800 hover:bg-emerald-100/50 hover:text-emerald-950">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium text-slate-800 hover:text-emerald-700">Home</Link>
                  <Link href="/products" className="text-lg font-medium text-slate-800 hover:text-emerald-700">All Products</Link>
                  <Link href="/categories" className="text-lg font-medium text-slate-800 hover:text-emerald-700">Shop by Category</Link>
                  <Link href="/wishlist" className="text-lg font-medium flex items-center gap-2 text-slate-800 hover:text-emerald-700">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500" /> Wishlist
                  </Link>
                  <Link href="/about" className="text-lg font-medium text-slate-800 hover:text-emerald-700">About Us</Link>
                  {user ? (
                    <>
                      <Link href="/dashboard" className="text-lg font-medium text-slate-800 hover:text-emerald-700">My Account</Link>
                      <Link href="/orders" className="text-lg font-medium text-slate-800 hover:text-emerald-700">My Orders</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-lg font-medium text-slate-800 hover:text-emerald-700">Login</Link>
                      <Link href="/register" className="text-lg font-medium text-slate-800 hover:text-emerald-700">Register</Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-emerald-600">ye</span>
                <span className="text-slate-800">lements</span>
              </span>
            </Link>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative w-full flex">
              <Input
                type="search"
                placeholder="Search for stationery, medical supplies..."
                className="w-full rounded-r-none bg-white text-slate-800 border-emerald-200 focus-visible:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="rounded-l-none bg-emerald-600 hover:bg-emerald-700 text-white border border-l-0 border-emerald-200">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 lg:gap-4 lg:w-1/4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-700 hover:bg-emerald-100/50 hover:text-slate-900 hidden sm:flex items-center gap-2 font-semibold">
                    <User className="h-5 w-5 text-emerald-600" />
                    <span className="truncate max-w-[100px]">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center text-emerald-600 font-bold">
                        <Settings className="mr-2 h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "vendor" && (
                    <DropdownMenuItem asChild>
                      <Link href="/vendor" className="cursor-pointer flex items-center text-emerald-600 font-bold">
                        <Store className="mr-2 h-4 w-4" /> Vendor Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 font-semibold" onClick={() => {
                    logout();
                    setLocation("/");
                  }}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild className="text-slate-700 hover:bg-emerald-100/50 hover:text-slate-900 font-semibold">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {user && (
              <Button variant="ghost" size="icon" asChild className="text-slate-700 hover:bg-emerald-100/50 hover:text-slate-900" title="My Orders">
                <Link href="/dashboard">
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="icon" asChild className="text-slate-700 hover:bg-emerald-100/50 hover:text-slate-900 relative">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-[#eefcf2]">
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
              placeholder="Search supplies..."
              className="w-full rounded-r-none bg-white text-slate-800 h-10 border-emerald-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Desktop Top Navigation (Replaces Sidebar) */}
      <div
        className="hidden lg:block border-t border-emerald-250/30"
        style={{
          backgroundColor: '#d3d3d3',
          backgroundImage: 'linear-gradient(315deg, #d3d3d3 0%, #2bc96d 74%)'
        }}
      >
        <nav className="container mx-auto px-4 lg:px-8 flex items-center gap-8 h-10">
          <Link href="/" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors">Home</Link>
          <Link href="/products" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors">Products</Link>
          <Link href="/categories" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors">Categories</Link>
          <Link href="/wishlist" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Wishlist</Link>
          {user && <Link href="/orders" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors">Orders</Link>}
          <Link href="/about" className="text-sm font-semibold text-slate-800 hover:text-slate-950 transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}
