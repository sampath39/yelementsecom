import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Please provide a recipient name"),
  mobile: z.string().min(10, "Please provide a valid 10-digit mobile number"),
  address: z.string().min(10, "Please provide a complete shipping address"),
  landmark: z.string().min(3, "Please provide a landmark for delivery"),
  paymentMethod: z.enum(["card", "upi", "cod", "cashback"]),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [userCoupons, setUserCoupons] = useState<string[]>([]);
  const [cashbackBalance, setCashbackBalance] = useState(0);

  useEffect(() => {
    if (user) {
      const storedCoupons = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
      setUserCoupons(storedCoupons);
      
      // Fetch cashback balance
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to fetch user");
          const data = await res.json();
          if (data.cashbackBalance !== undefined) {
            setCashbackBalance(data.cashbackBalance);
          }
        })
        .catch(err => {
          console.error("Failed to fetch cashback balance", err);
          setCashbackBalance(0);
        });
    }
  }, [user]);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    if (!userCoupons.includes(code) && code !== "FREEBULK") {
      toast.error("Invalid or unused coupon", {
        description: "This coupon is either not owned by you, or does not exist.",
      });
      return;
    }

    let discountAmt = 0;
    if (code === "DISCOUNT50") discountAmt = 50;
    else if (code === "DISCOUNT100") discountAmt = 100;
    else if (code === "DISCOUNT250") discountAmt = 250;
    else if (code === "FREEBULK") discountAmt = 0;

    setAppliedCoupon(code);
    setCouponDiscount(discountAmt);
    toast.success(`Coupon "${code}" applied successfully! 🏷️`, {
      description: discountAmt > 0 ? `Saved ₹${discountAmt} on this order.` : "Promo applied successfully.",
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon("");
    setCouponDiscount(0);
    toast.info("Coupon removed");
  };

  const { data: cart, isLoading } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: !!user,
    },
  });

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      mobile: user?.phone || "",
      address: user?.address || "",
      landmark: "",
      paymentMethod: "card",
    },
  });

  // 🚀 FINAL SUBMIT LOGIC
  const onSubmit = (data: CheckoutFormValues) => {
    if (!cart || cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const formattedAddress = `Recipient: ${data.fullName} | Mobile: ${data.mobile} | Address: ${data.address} | Landmark: ${data.landmark}`;

    // 💳 STRIPE
    if (data.paymentMethod === "card") {
      setLocation(`/payment?address=${encodeURIComponent(formattedAddress)}&couponDiscount=${couponDiscount}&coupon=${appliedCoupon}`);
      return;
    }

    // 📱 RAZORPAY (UPI)
    if (data.paymentMethod === "upi") {
      setLocation(`/razorpay?address=${encodeURIComponent(formattedAddress)}&couponDiscount=${couponDiscount}&coupon=${appliedCoupon}`);
      return;
    }

    // 💵 CASH ON DELIVERY (COD)
    if (data.paymentMethod === "cod") {
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      console.log("📦 Creating COD order to:", `${apiUrl}/api/orders`);
      
      fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress: formattedAddress,
          paymentMethod: "cod",
          couponDiscount: couponDiscount,
        }),
      })
        .then(async (res) => {
          console.log("📦 Order response status:", res.status);
          if (!res.ok) {
            const contentType = res.headers.get("content-type");
            console.log("📦 Response content-type:", contentType);
            if (contentType && contentType.includes("application/json")) {
              const errData = await res.json();
              throw new Error(errData.error || "Failed to create order");
            } else {
              const text = await res.text();
              console.log("📦 Non-JSON response:", text.substring(0, 200));
              throw new Error(`Server error: ${res.status}`);
            }
          }
          return res.json();
        })
        .then((order) => {
          console.log("📦 Order created successfully:", order);
          if (appliedCoupon) {
            const active = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
            const filtered = active.filter((c: string) => c !== appliedCoupon);
            localStorage.setItem("yelements_active_coupons", JSON.stringify(filtered));
          }
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast.success("Order Placed Successfully!");
          setLocation("/orders");
        })
        .catch((err) => {
          console.error("📦 COD order error:", err);
          toast.error(err.message || "Failed to process COD order");
        });
      return;
    }

    // 💵 CASHBACK WALLET PAY
    if (data.paymentMethod === "cashback") {
      const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
      const apiUrl = import.meta.env.VITE_API_URL || "";
      fetch(`${apiUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress: formattedAddress,
          paymentMethod: "cashback",
          couponDiscount: couponDiscount,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errData = await res.json();
              throw new Error(errData.error || "Failed to create order");
            } else {
              throw new Error(`Server error: ${res.status}`);
            }
          }
          return res.json();
        })
        .then((order) => {
          if (appliedCoupon) {
            const active = JSON.parse(localStorage.getItem("yelements_active_coupons") || "[]");
            const filtered = active.filter((c: string) => c !== appliedCoupon);
            localStorage.setItem("yelements_active_coupons", JSON.stringify(filtered));
          }
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast.success("Order Placed Successfully!");
          setLocation("/orders");
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message || "Failed to process cashback order");
        });
      return;
    }

    toast.error("Invalid payment method");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (isLoading || !cart) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Premium Checkout Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
            Institutional Escrow
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Secure <span className="text-teal-400">Procurement Checkout</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Ensure secure delivery destination routing and complete high-volume payment dispatch via encrypted commercial tunnels.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-4 max-w-6xl">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="checkout-form">

                {/* Shipping */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recipient Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter recipient's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter 10-digit mobile number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Flat, House no., Building, Apartment, Street Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="landmark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landmark</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g. Near Central Park" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="card" />
                            <span>Credit / Debit Card (Stripe)</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <RadioGroupItem value="upi" />
                            <span>UPI (PhonePe / GPay / Paytm / Razorpay)</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <RadioGroupItem value="cod" />
                            <span>Cash on Delivery</span>
                          </div>

                          {cashbackBalance > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <RadioGroupItem value="cashback" />
                              <span>Cashback Wallet Pay (Balance: ₹{cashbackBalance})</span>
                            </div>
                          )}
                        </RadioGroup>
                      )}
                    />
                  </CardContent>
                </Card>

              </form>
            </Form>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="divide-y divide-slate-100">
                  {cart.items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center py-2 text-xs text-slate-600">
                      <span className="line-clamp-1 max-w-[160px] font-medium">{item.name}</span>
                      <span className="font-semibold text-slate-800">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coupon Code</span>
                    {appliedCoupon ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold">
                        <span>🏷️ Applied: {appliedCoupon}</span>
                        <button 
                          type="button" 
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 font-bold uppercase text-[10px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="E.g. DISCOUNT50"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="h-9 text-xs rounded-xl"
                        />
                        <Button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Render Quick Select user coupons */}
                  {!appliedCoupon && userCoupons.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Your Available Coupons</span>
                      <div className="flex flex-wrap gap-1.5">
                        {userCoupons.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => handleApplyCoupon(code)}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2 py-1 text-[9px] font-mono font-bold text-emerald-800 transition cursor-pointer"
                          >
                            🎟️ {code}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotal, Discount & Total Rows */}
                <div className="border-t pt-4 space-y-2 text-xs font-medium">
                  <div className="flex justify-between text-slate-500">
                    <span>Cart Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2 mt-1">
                    <span>Order Total</span>
                    <span>{formatPrice(Math.max(0, cart.subtotal - couponDiscount))}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md hover:shadow-lg transition py-3 rounded-xl uppercase tracking-wider text-xs cursor-pointer"
                >
                  Proceed to Payment
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}