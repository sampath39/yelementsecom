import { AppLayout } from "@/components/layout/app-layout";
import { Link } from "wouter";
import { AlertTriangle, RefreshCw, ShoppingCart } from "lucide-react";

export default function PaymentFailure() {
  const params = new URLSearchParams(window.location.search);
  const errorMsg = params.get("message") || "The payment transaction was declined by the issuing bank or cancelled.";

  return (
    <AppLayout>
      <div className="min-h-[75vh] flex items-center justify-center bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl text-center relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-amber-600" />
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 uppercase tracking-wider mb-2">
              Payment Failed
            </span>

            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Transaction Declined
            </h1>
            
            <p className="mt-3 text-sm text-gray-500 max-w-sm">
              We were unable to complete your request. Please check your payment credentials and try again.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 text-left space-y-3">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Error details
            </div>
            
            <div className="text-sm text-gray-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              {errorMsg}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/10 hover:shadow-red-600/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Payment Again
            </Link>
            
            <Link
              href="/cart"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 hover:-translate-y-0.5 transition-all duration-200"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
