import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";

const apiUrl = import.meta.env.VITE_API_URL || "";

const stripePromise = loadStripe("pk_test_51THmXTC1y0CkzpW1UArjnY36fSn4isPFYrIgKKuKAZvK89r2D8l4UZ4lJVQ3BamI5fKkoaij4IHQiPttJD9Yuwma003RHXoaVn");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ GET ADDRESS FROM URL
  const params = new URLSearchParams(window.location.search);
  const address = params.get("address") || "";
  const couponDiscount = Number(params.get("couponDiscount") || "0");
  const appliedCoupon = params.get("coupon") || "";

  // ✅ FETCH CART TOTAL
  useEffect(() => {
    async function fetchCart() {
      const res = await fetch(`${apiUrl}/api/cart`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      const rawSubtotal = data.subtotal || 0;
      setAmount(Math.max(0, rawSubtotal - couponDiscount));
    }
    fetchCart();
  }, [couponDiscount]);

  const handlePayment = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      // ✅ CREATE PAYMENT INTENT
      const res = await fetch(
        `${apiUrl}/api/payment/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const { clientSecret } = await res.json();

      // ✅ CONFIRM PAYMENT
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        window.location.href = `/payment/failure?message=${encodeURIComponent(result.error.message || "Payment declined")}`;
        setLoading(false);
        return;
      }

      // ✅ CREATE ORDER AFTER PAYMENT
      const orderRes = await fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          shippingAddress: address,
          paymentMethod: "card",
          couponDiscount: couponDiscount,
        }),
      });

      const orderData = await orderRes.json();

      // Clear the applied coupon from active list in localStorage
      if (appliedCoupon) {
        const activeCoupons = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
        const filtered = activeCoupons.filter((c: string) => c !== appliedCoupon);
        localStorage.setItem("yelements_active_coupons", JSON.stringify(filtered));
      }

      window.location.href = `/payment/success?amount=${amount}&orderId=${orderData.id || "ORD-" + Math.floor(100000 + Math.random() * 900000)}`;

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handlePayment} className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Pay ₹{amount}</h2>

      <div className="border p-3 rounded mb-4">
        <CardElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-black text-white px-4 py-2 w-full rounded"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}