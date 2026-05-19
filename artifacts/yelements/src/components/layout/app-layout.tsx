import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Header } from "./header";
import { Footer } from "./footer";
import {
  Home,
  Package,
  Layers,
  Heart,
  FileText,
  Info,
  LogOut,
  Settings,
  Store,
  ShoppingCart,
} from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: cart } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: !!user,
    },
  });

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "All Products", icon: Package },
    { href: "/categories", label: "Categories", icon: Layers },
    { href: "/wishlist", label: "Wishlist", icon: Heart, color: "text-rose-500 fill-rose-500/10" },
    ...(user ? [{ href: "/orders", label: "My Orders", icon: FileText }] : []),
    { href: "/about", label: "About Us", icon: Info },
  ];

  return (
    <div className="min-h-screen flex bg-[#f7fcf8] text-slate-800 font-sans">


      {/* ── MAIN CONTENT WORKSPACE ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />
        
        {/* ⚡ SCROLLING TEXT TICKER FOR ANNOUNCEMENTS & TECHNICS ⚡ */}
        <div className="bg-[#b5e550] text-emerald-950 py-3 overflow-hidden relative border-b border-[#9ecc3b] shadow-sm z-20 flex items-center min-h-[40px]">
          <div className="flex items-center animate-[marquee_35s_linear_infinite] whitespace-nowrap gap-12 font-extrabold text-xs uppercase tracking-wider min-w-full leading-none">
            <span>🎉 Welcome to Yelements Store! Founder: Dr. Suresh Kumar Yele</span>
            <span className="text-white">🔥 FIRST BULK ORDER DELIVERY FREE! USE CODE "FREEBULK"</span>
            <span>🔬 High Precision Labware & Surgical Supplies Vetted by Experts</span>
            <span>📞 Contact Dr. Suresh Kumar Yele: 9290920349 / skyoptixinternational@gmail.com</span>
            <span>🏢 Office: Vijayawada, Andhra Pradesh, India</span>
            <span>🎉 Welcome to Yelements Store! Founder: Dr. Suresh Kumar Yele</span>
            <span className="text-white">🔥 FIRST BULK ORDER DELIVERY FREE! USE CODE "FREEBULK"</span>
            <span>🔬 High Precision Labware & Surgical Supplies Vetted by Experts</span>
            <span>📞 Contact Dr. Suresh Kumar Yele: 9290920349 / skyoptixinternational@gmail.com</span>
            <span>🏢 Office: Vijayawada, Andhra Pradesh, India</span>
          </div>
        </div>

        {/* Dynamic Inner Panel Viewport */}
        <main className="flex-1 flex flex-col w-full pb-12">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
