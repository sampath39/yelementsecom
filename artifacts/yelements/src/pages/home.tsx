import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  useGetFeaturedProducts,
  getGetFeaturedProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

// Import new Phase 2 components
import { HeroSlider } from "@/components/home/HeroSlider";
import { FloatingCategories } from "@/components/home/FloatingCategories";
import { FlashSale } from "@/components/home/FlashSale";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";

export default function Home() {
  const { user } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [coupons, setCoupons] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const storedPoints = localStorage.getItem("yelements_rewards");
      if (storedPoints === null) {
        localStorage.setItem("yelements_rewards", "500");
        setPoints(500);
      } else {
        setPoints(Number(storedPoints));
      }

      const storedCoupons = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
      setCoupons(storedCoupons);
    }
  }, [user]);

  const handleReferral = () => {
    const newPoints = points + 500;
    setPoints(newPoints);
    localStorage.setItem("yelements_rewards", String(newPoints));
    
    const refLink = `${window.location.origin}/register?ref=${user?.id || 'skyoptix'}`;
    navigator.clipboard.writeText(refLink);
    
    toast.success("Referral bonus added! 🎉", {
      description: "Added +500 points to your wallet. Referral link copied to clipboard!",
    });
  };

  const handleRedeem = (cost: number, code: string, value: number) => {
    if (points < cost) {
      toast.error("Insufficient points", {
        description: `You need at least ${cost} points to redeem this voucher.`,
      });
      return;
    }

    const newPoints = points - cost;
    setPoints(newPoints);
    localStorage.setItem("yelements_rewards", String(newPoints));

    const updatedCoupons = [...coupons, code];
    setCoupons(updatedCoupons);
    localStorage.setItem("yelements_active_coupons", JSON.stringify(updatedCoupons));

    toast.success("Voucher Redeemed! 🎟️", {
      description: `Redeemed ${cost} points for Coupon Code: ${code} (₹${value} discount).`,
    });
  };
  const { data: featuredProducts, isLoading: loadingFeatured } =
    useGetFeaturedProducts({
      query: { queryKey: getGetFeaturedProductsQueryKey() },
    });

  return (
    <AppLayout>

      <HeroSlider />
      <FloatingCategories />
      <FlashSale />

      {/* 🌟 SMART COUPON & REWARD SYSTEM WIDGET */}
      {user && (
        <section className="mt-6 container mx-auto px-4 lg:px-8">
          <div className="bg-background rounded-3xl border border-primary/20 shadow-md p-6 relative overflow-hidden glass">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              {/* Points display and status tier */}
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary uppercase tracking-widest border border-primary/20 flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3 h-3 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                  Yelements Reward Club
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-foreground">{points}</h2>
                  <span className="text-sm font-bold text-muted-foreground">Points Available</span>
                  <span className="text-xs text-primary font-semibold">(Est. Value: ₹{(points / 10).toFixed(2)})</span>
                </div>
                
                {/* Reward tier indicator */}
                <div className="flex items-center gap-2 pt-1.5">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
                      style={{ width: `${Math.min(100, (points / 2000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {points >= 2000 ? "Gold Patron" : points >= 1000 ? "Silver Member" : "Bronze Tier"}
                  </span>
                </div>
              </div>

              {/* Referral Actions & Redeem */}
              <div className="flex flex-wrap gap-4 items-center">
                
                {/* Refer Friend */}
                <div className="bg-secondary/50 p-3 rounded-2xl border border-border flex flex-col gap-1 max-w-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Referral Program</span>
                  <p className="text-[10px] text-muted-foreground leading-tight">Share your referral link with colleagues and gain +500 points instantly.</p>
                  <Button 
                    size="sm" 
                    onClick={handleReferral}
                    className="mt-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px] rounded-xl py-1 h-8 flex items-center gap-1 shadow"
                  >
                    Refer Friend & Copy Link 🔗
                  </Button>
                </div>

                {/* Redeem points for cash vouchers */}
                <div className="bg-secondary/50 p-3 rounded-2xl border border-border flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Redeem Rewards</span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRedeem(500, "DISCOUNT50", 50)}
                      disabled={points < 500}
                      className="bg-background hover:bg-secondary disabled:opacity-50 border border-border hover:border-primary/50 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-foreground flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-primary font-black">₹50 Off</span>
                      <span>500 pts</span>
                    </button>
                    
                    <button
                      onClick={() => handleRedeem(1000, "DISCOUNT100", 100)}
                      disabled={points < 1000}
                      className="bg-background hover:bg-secondary disabled:opacity-50 border border-border hover:border-primary/50 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-foreground flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-primary font-black">₹100 Off</span>
                      <span>1000 pts</span>
                    </button>

                    <button
                      onClick={() => handleRedeem(2000, "DISCOUNT250", 250)}
                      disabled={points < 2000}
                      className="bg-background hover:bg-secondary disabled:opacity-50 border border-border hover:border-primary/50 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-foreground flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-primary font-black">₹250 Off</span>
                      <span>2000 pts</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Active Vouchers / Coupons List */}
            {coupons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border relative z-10">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-2">My Unused Vouchers</span>
                <div className="flex flex-wrap gap-2">
                  {coupons.map((code, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success("Coupon code copied!", { description: `Use code ${code} during checkout.` });
                      }}
                      className="border border-primary border-dashed bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-primary cursor-pointer flex items-center gap-1.5 transition select-none hover:scale-105"
                    >
                      🎟️ {code}
                      <span className="text-[9px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded">Copy</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* 💎 INSTITUTIONAL MAPPED CATALOGUE SECTION */}
      <section className="py-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
                Institutional Quality
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight text-white flex items-center gap-2">
                💎 Mapped B2B Catalogue
              </h2>
              <p className="text-slate-400 text-xs mt-1 max-w-xl">
                Browse our verified products with complete multi-supplier rates, variant parameters, HSN/GST billing records, and technical sheet downloads.
              </p>
            </div>
            <Button variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 font-bold self-start md:self-center" asChild>
              <Link href="/products">Browse All Items</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={`mapped-${i}`} className="h-60 w-full bg-slate-800 rounded-2xl border border-slate-700" />
                  ))
              : Array.isArray(featuredProducts)
                ? featuredProducts
                    .filter((p: any) => p.mapping !== null && p.mapping !== undefined)
                    .slice(0, 5)
                    .map((product) => (
                      <ProductCard key={`mapped-${product.id}`} product={product as any} />
                    ))
                : null}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-foreground">
              <TrendingUp className="w-6 h-6 text-primary" />
              Trending Now
            </h2>
            <Button variant="link" asChild className="text-primary font-bold">
              <Link href="/products?sort=trending">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-60 w-full rounded-2xl" />
                  ))
              : Array.isArray(featuredProducts) ? featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                )) : null}
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS (Added to make page denser) ── */}
      <section className="py-8 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-foreground">
              <Sparkles className="w-6 h-6 text-purple-500" />
              New Arrivals
            </h2>
            <Button variant="link" asChild className="text-primary font-bold">
              <Link href="/products?sort=new">Explore Collection</Link>
            </Button>
          </div>

          {/* Reusing featured products here just to populate the grid visually */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={`new-${i}`} className="h-60 w-full rounded-2xl" />
                  ))
              : Array.isArray(featuredProducts) ? [...featuredProducts].reverse().map((product) => (
                  <ProductCard key={`new-${product.id}`} product={product as any} />
                )) : null}
          </div>
        </div>
      </section>

      {/* PHASE 2 RECENTLY VIEWED */}
      <RecentlyViewed />
    </AppLayout>
  );
}