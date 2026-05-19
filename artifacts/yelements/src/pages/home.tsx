import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Clock,
  Package,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  useGetFeaturedProducts,
  getGetFeaturedProductsQueryKey,
  useGetCategories,
  getGetCategoriesQueryKey,
  useGetProducts,
  getGetProductsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcons: Record<string, string> = {
  Stationery: "✏️",
  Medical: "🏥",
  Laboratory: "🔬",
  Surgical: "🩺",
  Canteen: "🍽️",
  Housekeeping: "🧹",
  Miscellaneous: "📦",
};

const categoryGradients: Record<string, string> = {
  Stationery:
    "from-blue-100 to-blue-50 hover:from-blue-200 border-blue-200 hover:border-blue-400",
  Medical:
    "from-red-100 to-red-50 hover:from-red-200 border-red-200 hover:border-red-400",
  Laboratory:
    "from-purple-100 to-purple-50 hover:from-purple-200 border-purple-200 hover:border-purple-400",
  Surgical:
    "from-orange-100 to-orange-50 hover:from-orange-200 border-orange-200 hover:border-orange-400",
  Canteen:
    "from-yellow-100 to-yellow-50 hover:from-yellow-200 border-yellow-200 hover:border-yellow-400",
  Housekeeping:
    "from-teal-100 to-teal-50 hover:from-teal-200 border-teal-200 hover:border-teal-400",
  Miscellaneous:
    "from-gray-100 to-gray-50 hover:from-gray-200 border-gray-200 hover:border-gray-400",
};

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

  const { data: categories, isLoading: loadingCategories } =
    useGetCategories({
      query: { queryKey: getGetCategoriesQueryKey() },
    });

  const { data: newProducts, isLoading: loadingNew } = useGetProducts(
    { limit: 8 },
    { query: { queryKey: getGetProductsQueryKey({ limit: 8 }) } }
  );

  return (
    <AppLayout>

      {/* 🌟 SMART COUPON & REWARD SYSTEM WIDGET */}
      {user && (
        <section className="mt-6 container mx-auto px-4 lg:px-8">
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-md p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Points display and status tier */}
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                  Yelements Reward Club
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-slate-850">{points}</h2>
                  <span className="text-sm font-bold text-slate-500">Points Available</span>
                  <span className="text-xs text-emerald-600 font-semibold">(Est. Value: ₹{(points / 10).toFixed(2)})</span>
                </div>
                
                {/* Reward tier indicator */}
                <div className="flex items-center gap-2 pt-1.5">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-[#39d353] transition-all duration-500" 
                      style={{ width: `${Math.min(100, (points / 2000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {points >= 2000 ? "Gold Patron" : points >= 1000 ? "Silver Member" : "Bronze Tier"}
                  </span>
                </div>
              </div>

              {/* Referral Actions & Redeem */}
              <div className="flex flex-wrap gap-4 items-center">
                
                {/* Refer Friend */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1 max-w-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referral Program</span>
                  <p className="text-[10px] text-slate-400 leading-tight">Share your referral link with colleagues and gain +500 points instantly.</p>
                  <Button 
                    size="sm" 
                    onClick={handleReferral}
                    className="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl py-1 h-8 flex items-center gap-1 shadow"
                  >
                    Refer Friend & Copy Link 🔗
                  </Button>
                </div>

                {/* Redeem points for cash vouchers */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Redeem Rewards</span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRedeem(500, "DISCOUNT50", 50)}
                      disabled={points < 500}
                      className="bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-slate-800 flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-emerald-600 font-black">₹50 Off</span>
                      <span>500 pts</span>
                    </button>
                    
                    <button
                      onClick={() => handleRedeem(1000, "DISCOUNT100", 100)}
                      disabled={points < 1000}
                      className="bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-slate-800 flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-emerald-600 font-black">₹100 Off</span>
                      <span>1000 pts</span>
                    </button>

                    <button
                      onClick={() => handleRedeem(2000, "DISCOUNT250", 250)}
                      disabled={points < 2000}
                      className="bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 hover:border-emerald-300 font-extrabold text-[10px] px-2.5 py-1.5 rounded-xl transition text-slate-800 flex flex-col items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span className="text-emerald-600 font-black">₹250 Off</span>
                      <span>2000 pts</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Active Vouchers / Coupons List */}
            {coupons.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">My Unused Vouchers</span>
                <div className="flex flex-wrap gap-2">
                  {coupons.map((code, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success("Coupon code copied!", { description: `Use code ${code} during checkout.` });
                      }}
                      className="bg-dashed border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-800 cursor-pointer flex items-center gap-1.5 transition select-none hover:scale-105"
                    >
                      🎟️ {code}
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Copy</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* 🚚 FREE BULK DELIVERY PROMO BANNER */}
      <section className="mt-6 container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 to-emerald-100 border border-emerald-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center gap-5 relative z-10 text-center md:text-left">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-md shrink-0 animate-bounce">
              🚚
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-emerald-950">First Bulk Order Delivery Free!</h3>
              <p className="text-xs md:text-sm text-emerald-800 mt-1 max-w-xl">
                Ready to equip your facility? Get 100% free delivery on your very first bulk order. Auto-applied or use coupon code <span className="font-extrabold text-emerald-950 underline">FREEBULK</span>. Under supervision of Dr. Suresh Kumar Yele.
              </p>
            </div>
          </div>
          <Link href="/products" className="relative z-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow hover:shadow-md transition duration-200 shrink-0">
            Start Procurement
          </Link>
        </div>
      </section>

      {/* ── HERO BANNER / BIG DEAL OF THE WEEK (DMART STYLE) ── */}
      <section className="mt-6 container mx-auto px-4 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#eefaf4] via-[#e5f5ed] to-[#d8f2e4] text-slate-800 shadow-sm border border-emerald-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8 md:p-12 relative z-10">
            <div className="space-y-6">
              <h2 className="text-emerald-700 font-extrabold text-sm uppercase tracking-widest">
                The Great Supply Fest
              </h2>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-850 tracking-tight leading-tight">
                Bulk Supplies. <span className="text-emerald-600">Best Offers.</span>
              </h1>
              
              <p className="text-slate-600 text-sm md:text-base max-w-md leading-relaxed">
                Equip your school, college, lab or hospital with top-tier scientific, medical, and office essentials. Flat institutional pricing, audited by Dr. Suresh Kumar Yele.
              </p>

              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-bold bg-[#39d353] hover:bg-[#2eb545] text-white shadow-md hover:shadow-lg transition-all duration-200 uppercase tracking-wide text-xs"
                >
                  SHOP NOW
                </Link>
              </div>
            </div>

            <div className="relative h-64 md:h-80 w-full flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop"
                alt="Medical Laboratory Instruments collage"
                className="w-full h-full object-contain rounded-2xl drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 🏷️ PERSONALIZED SPECIAL DISCOUNT BANNER */}
      {user && (user.discount ?? 0) > 0 && (
        <section className="mt-6 container mx-auto px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 text-white shadow-lg border border-rose-400/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_35%)]" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Tag className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Exclusive Institutional Discount Activated!</h3>
                <p className="text-xs text-rose-100 mt-0.5">
                  Welcome back, <span className="font-semibold">{user.name}</span>. You have an active <span className="font-extrabold text-yellow-300">{user.discount ?? 0}% special discount</span> applied directly to your entire cart!
                </p>
              </div>
            </div>
            <Link href="/products" className="relative z-10 bg-white text-rose-600 hover:bg-rose-50 font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-all shrink-0">
              Shop Now & Save
            </Link>
          </div>
        </section>
      )}

      {/* ── CATEGORY SECTION (DMART STYLE) ── */}
      <section className="py-12 container mx-auto px-4 lg:px-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider border-l-4 border-[#39d353] pl-3">
          Popular Categories
        </h3>

        {/* 🔥 FIXED GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {loadingCategories
            ? Array(7)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))
            : Array.isArray(categories) ? categories.map((category) => {
                const icon = categoryIcons[category.name] ?? "📦";

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="group block"
                  >
                    <div className="bg-white border border-slate-250 rounded-xl p-5 text-center transition-all duration-200 hover:shadow-md hover:border-emerald-200 flex flex-col items-center justify-center h-32">
                      <div className="w-14 h-14 rounded-full bg-[#f2fbf5] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-200 shrink-0">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-2xl">{icon}</span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-750 leading-tight group-hover:text-emerald-700 transition-colors">
                        {category.name}
                      </h4>
                    </div>
                  </Link>
                );
              }) : null}
        </div>
      </section>

        {/* ── 3D INTERACTIVE HIGHLIGHT SECTION ── */}
        <section className="py-16 bg-gradient-to-b from-white to-green-50/20 relative overflow-hidden border-y border-emerald-50">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* 3D Floating Isometric Canvas Illustration */}
              <div className="relative flex items-center justify-center h-[350px] lg:h-[400px] [perspective:1000px] select-none order-2 lg:order-1">
                {/* Main 3D Card container with hover rotational effect */}
                <div className="relative w-72 h-72 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-2xl preserve-3d hover:[transform:rotateX(15deg)_rotateY(-15deg)] transition-all duration-700 ease-out flex items-center justify-center group/card">
                  
                  {/* Floating Element 1 - Box */}
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/95 rounded-2xl border border-emerald-100 shadow-lg p-3 flex flex-col justify-between preserve-3d [transform:translateZ(60px)] animate-3d-box hover:scale-105 transition-transform duration-300">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-xl">📦</div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">Rapid Delivery</p>
                      <p className="text-[8px] text-slate-400">Pan-India Support</p>
                    </div>
                  </div>

                  {/* Floating Element 2 - Lab flask */}
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-emerald-900 text-white rounded-3xl shadow-xl p-4 flex flex-col justify-between preserve-3d [transform:translateZ(80px)] animate-3d-flask hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl">🧪</div>
                    <div>
                      <p className="text-xs font-bold">Tested Grade</p>
                      <p className="text-[9px] text-emerald-200">100% Quality Check</p>
                    </div>
                  </div>

                  {/* Center Core Floating Globe / Logo */}
                  <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-2xl flex flex-col items-center justify-center text-white preserve-3d [transform:translateZ(40px)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent)]" />
                    <span className="text-4xl animate-bounce">⭐</span>
                    <p className="mt-2 text-[10px] uppercase tracking-widest font-black text-emerald-100">Premium Tech</p>
                  </div>
                  
                  {/* Micro shadow underneath */}
                  <div className="absolute bottom-4 w-52 h-3 bg-slate-900/10 rounded-full blur-md" />
                </div>
              </div>

              {/* Content Text */}
              <div className="space-y-6 order-1 lg:order-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-widest">
                  ⚙️ Smart Logistics
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-850">
                  Revolutionary Supply Logistics for Your Institution
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                  Our advanced supply network connects manufacturers directly to schools, colleges, and clinical labs. With automated tracking, dynamic pricing models, and specialized institutional discounts, we take care of the heavy lifting.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-emerald-100/50 bg-emerald-50/20">
                    <p className="text-2xl font-bold text-emerald-600">99.4%</p>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">On-Time Fulfilment</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-emerald-100/50 bg-emerald-50/20">
                    <p className="text-2xl font-bold text-emerald-600">24/7</p>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">Dedicated Helpdesk</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Best Products
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured
              ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-xl" />
                  ))
              : Array.isArray(featuredProducts) ? featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                )) : null}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}