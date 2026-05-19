import { Link } from "wouter";
import { Package, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react";

const categories = [
  { name: "Stationery", href: "/products?category=stationery", color: "hover:text-blue-300" },
  { name: "Medical Supplies", href: "/products?category=medical", color: "hover:text-red-300" },
  { name: "Laboratory", href: "/products?category=laboratory", color: "hover:text-purple-300" },
  { name: "Surgical", href: "/products?category=surgical", color: "hover:text-orange-300" },
  { name: "Canteen", href: "/products?category=canteen", color: "hover:text-yellow-300" },
  { name: "Housekeeping", href: "/products?category=housekeeping", color: "hover:text-teal-300" },
  { name: "Miscellaneous", href: "/products?category=miscellaneous", color: "hover:text-gray-300" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 text-white mt-auto">
      {/* Decorative colored top border */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-green-500 via-amber-400 via-red-500 to-purple-500" />

      {/* Colorful blobs background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-green-400 blur-3xl" />
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-amber-400 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-56 h-56 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 rounded-full bg-purple-500 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">Yelements</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              India's trusted B2B/B2C institutional supply platform for schools, hospitals, labs & businesses. Quality products, fast delivery.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { Icon: Facebook, color: "hover:bg-blue-600", href: "#" },
                { Icon: Twitter, color: "hover:bg-sky-500", href: "#" },
                { Icon: Instagram, color: "hover:bg-pink-600", href: "#" },
                { Icon: Linkedin, color: "hover:bg-blue-700", href: "#" },
              ].map(({ Icon, color, href }, i) => (
                <a key={i} href={href} className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-colors duration-200 ${color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-base mb-4 text-amber-400 uppercase tracking-widest text-xs">Shop Categories</h4>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.href} className={`text-sm text-slate-300 flex items-center gap-1.5 group transition-colors ${cat.color}`}>
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-base mb-4 text-green-400 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "My Account", href: "/dashboard" },
                { label: "Order History", href: "/dashboard" },
                { label: "My Cart", href: "/cart" },
                { label: "Become a Vendor", href: "/register?role=vendor" },
                { label: "Bulk Orders", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-300 flex items-center gap-1.5 group hover:text-green-300 transition-colors">
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-base mb-4 text-blue-400 uppercase tracking-widest text-xs">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300">Vijayawada, Andhra Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-400 shrink-0" />
                <a href="tel:+919290920349" className="text-sm text-slate-300 hover:text-green-300 transition-colors">+91 9290920349</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:skyoptixinternational@gmail.com" className="text-sm text-slate-300 hover:text-amber-300 transition-colors">skyoptixinternational@gmail.com</a>
              </li>
            </ul>

            {/* Category color chips */}
            <div className="mt-6">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">We supply for</p>
              <div className="flex flex-wrap gap-1.5">
                {["Schools","Hospitals","Labs","Offices","Clinics","Hotels"].map((s, i) => {
                  const colors = ["bg-blue-600/40","bg-red-600/40","bg-purple-600/40","bg-green-600/40","bg-orange-600/40","bg-pink-600/40"];
                  return (
                    <span key={s} className={`text-[10px] px-2 py-0.5 rounded-full text-white font-medium ${colors[i]}`}>{s}</span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Yelements Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {["🔒 Secure Checkout", "🚚 Pan-India Delivery", "✅ GST Invoices"].map((tag) => (
              <span key={tag} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
