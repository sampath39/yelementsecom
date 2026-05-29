import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, Wallet, Gift, Trophy, Star, ArrowUpRight, ArrowDownLeft, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  createdAt: string;
  total: number;
  status: string;
  items: OrderItem[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("yelements_token");
    if (!token) {
      setLoadingOrders(false);
      setOrdersError("Not authenticated");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || "";
    fetch(`${apiUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        return res.json();
      })
      .then((data) => {
        setOrders(data.orders || data);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error(err);
        setOrdersError(err.message);
        setLoadingOrders(false);
      });
  }, []);

  if (!user) {
    setLocation("/login");
    return null;
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Packed</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(`YEL-${user.name.substring(0,4).toUpperCase()}-2026`);
    toast.success("Referral code copied!", { description: "Share this code to get 500 reward points for each successful signup." });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground mt-1">Manage your orders, wallet, and profile</p>
          </div>
          <div className="flex gap-3">
            {user.role === "admin" && (
              <Button asChild>
                <Link href="/admin">Go to Admin Panel</Link>
              </Button>
            )}
            {user.role === "vendor" && (
              <Button asChild>
                <Link href="/vendor">Go to Vendor Panel</Link>
              </Button>
            )}
          </div>
        </div>

        {(user.discount ?? 0) > 0 && (
          <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-orange-500 text-white rounded-2xl p-5 mb-8 shadow-sm flex items-center justify-between animate-pulse">
            <div>
              <h4 className="font-extrabold text-base">Special Institutional Discount Active!</h4>
              <p className="text-xs text-rose-100 mt-1">Your account has been assigned a customized {user.discount ?? 0}% cart-wide discount.</p>
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-white/20 font-extrabold text-sm px-3.5 py-1.5">{user.discount ?? 0}% OFF</Badge>
          </div>
        )}

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-8 overflow-x-auto flex flex-nowrap w-fit max-w-full no-scrollbar pb-2">
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="wallet">Cashback Wallet</TabsTrigger>
            <TabsTrigger value="rewards">Loyalty & Rewards</TabsTrigger>
            <TabsTrigger value="profile">Profile details</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>View and track your institutional supply orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-16 text-red-600">
                    <p>Failed to load orders: {ordersError}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-xl overflow-hidden">
                        <div className="bg-muted/30 p-4 border-b flex flex-wrap gap-4 justify-between items-center text-sm">
                          <div className="flex gap-8">
                            <div>
                              <div className="text-muted-foreground uppercase text-xs font-semibold mb-1">Order Placed</div>
                              <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground uppercase text-xs font-semibold mb-1">Total</div>
                              <div className="font-medium">{formatPrice(order.total)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground uppercase text-xs font-semibold mb-1">Order #</div>
                              <div className="font-medium">YEL-{order.id.toString().padStart(6, "0")}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getStatusBadge(order.status)}
                            <Button size="sm" variant="outline" onClick={() => (window.location.href = `/tracking?id=${order.id}`)}>
                              Track 🚚
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 md:p-6">
                          <h4 className="font-medium mb-4">Items</h4>
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center shrink-0 border">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-6 h-6 text-muted-foreground/50" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Link href={`/products/${item.productId}`} className="font-medium hover:text-primary">
                                    {item.name}
                                  </Link>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Qty: {item.quantity} × {formatPrice(item.price)}
                                  </div>
                                </div>
                                <div className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-lg">
                    <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No orders yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't placed any orders with Yelements.</p>
                    <Button asChild>
                      <Link href="/products">Start Shopping</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 💰 CASHBACK WALLET UI */}
          <TabsContent value="wallet">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <CardContent className="pt-8 pb-8 relative z-10">
                    <p className="text-emerald-100 font-semibold mb-2 uppercase tracking-wider text-xs">Available Balance</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-6">{formatPrice(1250)}</h2>
                    <div className="flex gap-3">
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow flex-1">
                        Add Money
                      </Button>
                      <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold flex-1">
                        Withdraw
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { title: "Cashback Earned", date: "Today", amount: "+ ₹150", type: 'in', icon: ArrowDownLeft },
                        { title: "Order Payment", date: "Yesterday", amount: "- ₹4,500", type: 'out', icon: ArrowUpRight },
                        { title: "Referral Bonus", date: "15 May 2026", amount: "+ ₹500", type: 'in', icon: Gift },
                        { title: "Added to Wallet", date: "10 May 2026", amount: "+ ₹2,000", type: 'in', icon: ArrowDownLeft },
                      ].map((txn, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${txn.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              <txn.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{txn.title}</p>
                              <p className="text-xs text-muted-foreground">{txn.date}</p>
                            </div>
                          </div>
                          <div className={`font-black ${txn.type === 'in' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {txn.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 🎁 LOYALTY & REWARDS UI */}
          <TabsContent value="rewards">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                  <CardContent className="pt-8">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-black text-xl mb-1">Gold Tier Member</h3>
                        <p className="text-amber-100 text-xs">Unlock Platinum at 5,000 pts</p>
                      </div>
                      <Trophy className="w-12 h-12 text-amber-200" />
                    </div>
                    <div className="mb-2 flex justify-between text-xs font-bold text-amber-100">
                      <span>3,240 Points</span>
                      <span>5,000 Points</span>
                    </div>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <Button className="w-full mt-6 bg-emerald-600 text-white hover:bg-emerald-700 font-bold">
                      Redeem Points
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-primary" /> Refer & Earn
                    </CardTitle>
                    <CardDescription>Invite colleagues to join Yelements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">You get <span className="font-bold text-emerald-600">500 Points</span> and they get a <span className="font-bold text-emerald-600">10% Off</span> coupon on their first order!</p>
                    <div className="flex items-center gap-2 mb-4">
                      <code className="flex-1 bg-muted px-4 py-2 rounded-lg border border-dashed font-bold text-primary">
                        YEL-{user.name.substring(0,4).toUpperCase()}-2026
                      </code>
                      <Button onClick={copyReferralCode} size="icon" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Manage your personal and institution information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                      {(user.discount ?? 0) > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 font-bold">
                          {user.discount ?? 0}% Special Discount
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2" /> Registered Address
                  </h4>
                  <p className="bg-muted/20 p-3 rounded-md border">{user.address || "No address provided yet."}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2" /> Member Since
                  </h4>
                  <p className="p-3">
                    {new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}