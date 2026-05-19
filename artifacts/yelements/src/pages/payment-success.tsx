import { AppLayout } from "@/components/layout/app-layout";
import { Link } from "wouter";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  // Try to parse order info from URL or localStorage
  const params = new URLSearchParams(window.location.search);
  const amountStr = params.get("amount") || "";
  const orderId = params.get("orderId") || "ORD-" + Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    const totalAmount = Number(amountStr) || 500;
    const earned = Math.floor(totalAmount / 10);
    if (earned > 0) {
      const awardedOrders = JSON.parse(localStorage.getItem("yelements_awarded_orders") || "[]");
      if (!awardedOrders.includes(orderId)) {
        const currentPoints = Number(localStorage.getItem("yelements_rewards") || "500");
        localStorage.setItem("yelements_rewards", String(currentPoints + earned));
        awardedOrders.push(orderId);
        localStorage.setItem("yelements_awarded_orders", JSON.stringify(awardedOrders));
        toast.success(`Congratulations! You earned ${earned} Yelements Reward Points! 🌟`);
      }
    }
  }, [amountStr, orderId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const amount = Number(amountStr) || 500;

  return (
    <AppLayout>
      <div className="min-h-[75vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl text-center relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 uppercase tracking-wider mb-2">
              Payment Verified
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Order Confirmed!
            </h1>
            
            <p className="mt-3 text-sm text-gray-500 max-w-sm">
              Thank you for your purchase. Your payment was processed successfully and your items are now being prepared for shipping.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 text-left space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Order Number</span>
              <span className="font-mono font-bold text-gray-700">{orderId}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Payment Method</span>
              <span className="font-semibold text-gray-700">Digital Wallet / Card</span>
            </div>

            <div className="h-px bg-gray-200/60 my-2" />

            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-900">Total Paid</span>
              <span className="font-extrabold text-emerald-600 text-base">
                {formatPrice(amount)}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/orders"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              View Your Orders
            </Link>
            
            <Link
              href="/products"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 hover:-translate-y-0.5 transition-all duration-200"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
