import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Package } from "lucide-react";
import { useLocation } from "wouter";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  useEffect(() => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";

    fetch(`${apiUrl}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setOrders([]);
            setLoading(false);
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Premium Orders Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
            Dispatch Audit
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Institutional <span className="text-teal-400">Order History</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Audit your order invoices, shipment statuses, transit OTP passkeys, and real-time mapping details for all institutional procurements.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-4 max-w-4xl space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-dashed rounded-3xl max-w-md mx-auto space-y-4">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <h3 className="text-lg font-bold text-slate-800">No active procurements found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">Explore our high-precision catalogue and create your first facility order.</p>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="bg-gradient-to-b from-white to-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-500">Order ID: #{o.id}</span>
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full ${
                    o.status === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    o.status === "shipped" ? "bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  <b>Shipping To:</b> {o.shippingAddress}
                </p>
                <div className="text-xs text-slate-400">
                  Ordered on {new Date(o.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                
                {/* 🚚 Live Order Tracking Progress */}
                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-slate-500 overflow-x-auto pb-2">
                  {["placed", "packed", "shipped", "out for delivery", "delivered"].map((step, index, arr) => {
                    const statusIndex = arr.indexOf(o.status?.toLowerCase() || "placed");
                    const isActive = statusIndex >= index;
                    return (
                      <div key={step} className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isActive ? "border-teal-500 bg-teal-50 text-teal-600 font-bold" : "border-slate-200 bg-slate-50 text-slate-300"}`}>
                          {isActive ? "✓" : index + 1}
                        </div>
                        <span className={isActive ? "text-teal-700 font-bold" : ""}>{step.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>
                        {index < arr.length - 1 && <div className={`w-4 h-px ${isActive && statusIndex > index ? "bg-teal-500" : "bg-slate-200"}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-3 shrink-0">
                <div className="space-y-0.5 md:text-right">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Invoice</span>
                  <p className="text-lg font-black text-slate-900">{formatINR(o.total)}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/tracking?id=${o.id}`)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow hover:shadow-teal-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                  >
                    Track 🚚
                  </button>
                  <button
                    onClick={() => setLocation(`/products`)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2 rounded-xl hover:-translate-y-0.5 transition-all"
                  >
                    Rebuy 🔁
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}