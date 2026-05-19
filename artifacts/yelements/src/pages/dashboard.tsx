import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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

    fetch("/api/orders", {
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
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Packed</Badge>; // Packed
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground mt-1">Manage your orders and profile settings</p>
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
          <TabsList className="mb-8">
            <TabsTrigger value="orders">Order History</TabsTrigger>
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