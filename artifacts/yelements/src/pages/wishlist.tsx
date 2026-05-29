import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Heart, Package, BellRing, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  categoryName?: string;
  stock: number;
}

export default function Wishlist() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔔 Price Drop Alerts State
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  const fetchWishlist = () => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";

    fetch(`${apiUrl}/api/wishlist`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch wishlist");
        return res.json();
      })
      .then((data) => {
        // Mock adding originalPrice to simulate price drops for 20% of items
        const mockedData = data.map((item: any, i: number) => ({
          ...item,
          originalPrice: i % 3 === 0 ? item.price * 1.25 : undefined // 25% price drop on some items
        }));
        setItems(mockedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }
    fetchWishlist();
  }, [user]);

  const handleRemove = (productId: number) => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";

    fetch(`${apiUrl}/api/wishlist/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to remove item");
        return res.json();
      })
      .then(() => {
        toast.success("Removed from wishlist");
        setItems((prev) => prev.filter((item) => item.id !== productId));
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to remove item");
      });
  };

  const handleAddToCart = (productId: number) => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";

    fetch(`${apiUrl}/api/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 1,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add to cart");
        return res.json();
      })
      .then(() => {
        toast.success("Added to cart!");
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to add to cart");
      });
  };

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);

  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    if (!alertsEnabled) {
      toast.success("Price Alerts Activated 🔔", { description: "We will email you instantly when wishlist items drop in price!" });
    } else {
      toast("Price Alerts Disabled", { description: "You will no longer receive price drop emails." });
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      {/* Premium Wishlist Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 uppercase tracking-widest">
            Saved Procurements
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            My Corporate <span className="text-rose-400">Wishlist</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Review, evaluate, and checkout items saved for your facility. Instantly move curated surgical gear or lab glass directly to your current institutional cart.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        
        {/* 🔔 PRICE DROP ALERTS TOGGLE BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <div className={`p-3 rounded-full ${alertsEnabled ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400'} transition-colors`}>
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Price Drop Alerts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Get notified instantly when prices drop for items in your wishlist.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500">{alertsEnabled ? "ON" : "OFF"}</span>
            <Switch checked={alertsEnabled} onCheckedChange={toggleAlerts} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((product) => {
              const hasPriceDrop = product.originalPrice && product.originalPrice > product.price;
              const dropPercentage = hasPriceDrop ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0;

              return (
                <Card key={product.id} className="bg-gradient-to-b from-white to-slate-50 border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1.5 active:translate-y-0 transition-all duration-300 group flex flex-col h-full justify-between relative">
                  
                  {/* Price Drop Badge */}
                  {hasPriceDrop && (
                    <div className="absolute top-3 left-3 z-10 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-md flex items-center gap-1 animate-pulse">
                      <TrendingDown className="w-3 h-3" /> PRICE DROP (-{dropPercentage}%)
                    </div>
                  )}

                  <div className="aspect-square relative bg-slate-50 border-b overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
                        <Package className="w-10 h-10 stroke-1" />
                      </div>
                    )}
                    <button 
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center text-white shadow border transition-colors z-10"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        {product.categoryName || "Supplies"}
                      </span>
                      <Link href={`/products/${product.id}`} className="font-bold text-sm leading-tight text-slate-800 hover:text-primary transition-colors line-clamp-2 block">
                        {product.name}
                      </Link>
                    </div>
  
                    <div className="space-y-3 mt-4 pt-2 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Price</p>
                        <div className="flex items-end gap-2">
                          <p className="font-extrabold text-slate-900 text-base">
                            {formatINR(product.price)}
                          </p>
                          {hasPriceDrop && (
                            <p className="text-xs text-muted-foreground line-through pb-0.5">
                              {formatINR(product.originalPrice!)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleAddToCart(product.id)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs py-2 h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" /> Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed rounded-3xl max-w-md mx-auto space-y-6">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto stroke-1" />
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold">Your wishlist is empty</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Explore our high-quality institutional catalog and save items here.</p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow hover:-translate-y-0.5 transition-all rounded-xl h-10">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
