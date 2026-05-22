import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function RazorpayPage() {
  const { user } = useAuth();

  // 📝 Extract shipping address and coupon params from URL query string
  const params = new URLSearchParams(window.location.search);
  const address = params.get("address") || "Paid via Razorpay";
  const couponDiscount = Number(params.get("couponDiscount") || "0");
  const appliedCoupon = params.get("coupon") || "";

  const handlePay = async (amount: number, shippingAddress: string, token: string) => {
    try {
      // 1. Create order on Express backend
      const res = await fetch(`${apiUrl}/api/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          address: shippingAddress,
        }),
      });

      const order = await res.json();

      if (!order.id) {
        window.location.href = `/payment/failure?message=${encodeURIComponent(order.error || "Order creation failed")}`;
        return;
      }

      // 2. Configure Razorpay checkout popup options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mocked",
        amount: order.amount,
        currency: "INR",
        name: "Yelements Store",
        description: "Institutional Purchase",
        order_id: order.id,

        handler: async function (response: any) {
          // 3. Verify payment signature on backend
          try {
            const verify = await fetch(`${apiUrl}/api/razorpay/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...response,
                address: shippingAddress,
                couponDiscount: couponDiscount,
              }),
            });

            const data = await verify.json();

            if (data.success) {
              if (appliedCoupon) {
                const activeCoupons = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
                const filtered = activeCoupons.filter((c: string) => c !== appliedCoupon);
                localStorage.setItem("yelements_active_coupons", JSON.stringify(filtered));
              }
              window.location.href = `/payment/success?amount=${amount}&orderId=${response.razorpay_order_id}`;
            } else {
              window.location.href = `/payment/failure?message=${encodeURIComponent(data.error || "Payment signature verification failed")}`;
            }
          } catch (err: any) {
            window.location.href = `/payment/failure?message=${encodeURIComponent(err.message || "Failed to contact verification server")}`;
          }
        },

        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "customer@yelements.com",
        },

        theme: {
          color: "#059669", // Premium Emerald Green to match UI theme
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error(err);
      window.location.href = `/payment/failure?message=${encodeURIComponent(err.message || "Razorpay initialization error")}`;
    }
  };

  // 🔄 Fetch cart subtotal and auto-trigger payment
  useEffect(() => {
    async function fetchCartAndTrigger() {
      try {
        const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(`${apiUrl}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await res.json();
        const subtotal = data.subtotal || 0;
        const finalAmount = Math.max(0, subtotal - couponDiscount);

        if (finalAmount > 0) {
          await handlePay(finalAmount, address, token);
        } else {
          window.location.href = "/cart";
        }
      } catch (err: any) {
        console.error(err);
        window.location.href = `/payment/failure?message=${encodeURIComponent(err.message || "Failed to load shopping cart total")}`;
      }
    }

    fetchCartAndTrigger();
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50/50">
      <div className="flex flex-col items-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white animate-pulse">Launching Secure UPI Portal...</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs text-center">Please do not refresh the page or click back while redirecting.</p>
      </div>
    </div>
  );
}