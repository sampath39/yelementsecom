import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import {
  useGetAdminStats,
  getGetAdminStatsQueryKey,
  useGetAllOrders,
  getGetAllOrdersQueryKey,
  useGetUsers,
  getGetUsersQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  Search,
  Percent,
  Calendar,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [userDiscounts, setUserDiscounts] = useState<Record<number, string>>({});

  const { data: stats, isLoading: loadingStats } = useGetAdminStats({
    query: {
      queryKey: getGetAdminStatsQueryKey(),
      enabled: user?.role === 'admin',
      refetchInterval: 5000,
    }
  });
  const statsAny = stats as any;

  const { data: allOrders, isLoading: loadingOrders } = useGetAllOrders({
    query: {
      queryKey: getGetAllOrdersQueryKey(),
      enabled: user?.role === 'admin',
      refetchInterval: 5000,
    }
  });

  const { data: allUsers, isLoading: loadingUsers } = useGetUsers({
    query: {
      queryKey: getGetUsersQueryKey(),
      enabled: user?.role === 'admin',
      refetchInterval: 5000,
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const handleUpdateStatus = (orderId: number, status: string) => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";
    
    fetch(`${apiUrl}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to update status");
        toast.success("Order status updated!");
        queryClient.invalidateQueries({ queryKey: getGetAllOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      })
      .catch((err) => {
        toast.error(err.message || "Error updating order status");
      });
  };

  const handleUpdateDiscount = (userId: number) => {
    const val = userDiscounts[userId];
    if (val === undefined) return;
    const discount = parseInt(val, 10);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast.error("Discount must be a percentage between 0 and 100");
      return;
    }

    setUpdatingUserId(userId);
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";
    
    fetch(`${apiUrl}/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ discount }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to update discount");
        toast.success("Special discount updated successfully!");
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
      })
      .catch((err) => {
        toast.error(err.message || "Error updating discount");
      })
      .finally(() => {
        setUpdatingUserId(null);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Packed</Badge>; // Packed
      case 'shipped': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mb-6">This section of the portal is restricted to system administrators.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-emerald-50/50 py-8 px-4 lg:px-8 border-b border-emerald-100">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-emerald-600 w-8 h-8" />
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Admin Control Panel</h1>
            </div>
            <p className="text-slate-600">System overview and institutional supply management</p>
          </div>
          <Button 
            className="bg-teal-600 text-white hover:bg-teal-700 font-bold self-start md:self-auto rounded-xl shadow hover:shadow-teal-500/20"
            onClick={() => setLocation("/admin/mapping")}
          >
            Open Catalog Mapping Workspace ➔
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {loadingStats ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : stats && (
            <>
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.totalOrders}</h3>
                    <p className="text-xs text-yellow-600 mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {stats.pendingOrders} pending</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Daily Revenue</p>
                    <h3 className="text-3xl font-bold text-foreground">{formatPrice(statsAny.dailyRevenue)}</h3>
                    <p className="text-xs text-green-600 mt-1">{statsAny.dailyOrders} orders today</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Revenue</p>
                    <h3 className="text-3xl font-bold text-foreground">{formatPrice(statsAny.monthlyRevenue)}</h3>
                    <p className="text-xs text-blue-600 mt-1">{statsAny.monthlyOrders} orders this month</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Products</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.totalProducts}</h3>
                    <p className="text-xs text-destructive mt-1 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {stats.lowStockProducts} low stock</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-600">
                    <Package className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Registered Users</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.totalUsers}</h3>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* 📊 DATA VISUALIZATIONS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-2 border-border shadow-md">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" /> Revenue & Order Analytics
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Monthly gross revenue progression trends</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">Gross: +24% YoY</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={[
                      { name: "Jan", Sales: 45000 },
                      { name: "Feb", Sales: 52000 },
                      { name: "Mar", Sales: 49000 },
                      { name: "Apr", Sales: 63000 },
                      { name: "May", Sales: stats?.totalRevenue ? Math.floor(stats.totalRevenue * 0.4) : 85000 },
                      { name: "Jun", Sales: stats?.totalRevenue ? Math.floor(stats.totalRevenue) : 120000 },
                    ]} 
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      labelClassName="text-slate-400 font-bold"
                    />
                    <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-6 lg:col-span-1">
            <Card className="border-border shadow-md">
              <CardHeader className="pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-500" /> Category Share
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Sales breakdown across core categories</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Stationery", value: 35, color: "#10b981" },
                          { name: "Medical", value: 25, color: "#3b82f6" },
                          { name: "Laboratory", value: 20, color: "#8b5cf6" },
                          { name: "Surgical", value: 12, color: "#ec4899" },
                          { name: "Housekeeping", value: 8, color: "#f59e0b" },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: "Stationery", value: 35, color: "#10b981" },
                          { name: "Medical", value: 25, color: "#3b82f6" },
                          { name: "Laboratory", value: 20, color: "#8b5cf6" },
                          { name: "Surgical", value: 12, color: "#ec4899" },
                          { name: "Housekeeping", value: 8, color: "#f59e0b" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold text-gray-600">
                  {[
                    { name: "Stationery", value: 35, color: "#10b981" },
                    { name: "Medical", value: 25, color: "#3b82f6" },
                    { name: "Laboratory", value: 20, color: "#8b5cf6" },
                    { name: "Surgical", value: 12, color: "#ec4899" },
                    { name: "Housekeeping", value: 8, color: "#f59e0b" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 🏷️ SPECIAL USER DISCOUNTS CARD */}
            <Card className="border-border shadow-md">
              <CardHeader className="pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Percent className="w-5 h-5 text-rose-500" /> Special User Discounts
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Assign custom cart discounts based on username</p>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {loadingUsers ? (
                    <div className="text-center py-4 text-muted-foreground text-xs">Loading users...</div>
                  ) : allUsers && allUsers.length > 0 ? (
                    allUsers
                      .filter(u => 
                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((usr) => (
                        <div key={usr.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{usr.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{usr.email}</p>
                            <p className="text-[10px] text-emerald-600 font-medium">Current: {usr.discount}% off</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              className="w-14 h-8 px-1 text-center"
                              value={userDiscounts[usr.id] !== undefined ? userDiscounts[usr.id] : (usr.discount ?? 0).toString()}
                              onChange={(e) => setUserDiscounts({ ...userDiscounts, [usr.id]: e.target.value })}
                            />
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-[10px]"
                              disabled={updatingUserId === usr.id}
                              onClick={() => handleUpdateDiscount(usr.id)}
                            >
                              {updatingUserId === usr.id ? "Saving..." : "Apply"}
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-xs">No users found</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders List */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <div>
                  <CardTitle>System Orders</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Recent institutional purchases</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4 font-medium">Order ID</th>
                        <th className="px-6 py-4 font-medium">Institution</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loadingOrders ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading orders...</td></tr>
                      ) : allOrders && allOrders.length > 0 ? (
                        allOrders.slice(0, 10).map(order => (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 font-medium">#YEL-{order.id.toString().padStart(6, '0')}</td>
                            <td className="px-6 py-4">{order.userName}</td>
                            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-semibold">{formatPrice(order.total)}</td>
                            <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                            <td className="px-6 py-4 flex gap-1.5 items-center">
                              {order.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                                  onClick={() => handleUpdateStatus(order.id, 'processing')}
                                >
                                  Pack
                                </Button>
                              )}
                              {order.status === 'processing' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                  onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                >
                                  Ship
                                </Button>
                              )}
                              {order.status === 'shipped' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                  onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                >
                                  Deliver
                                </Button>
                              )}
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 px-2 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                              )}
                              {order.status === 'delivered' && (
                                <span className="text-[10px] text-muted-foreground font-medium">Completed</span>
                              )}
                              {order.status === 'cancelled' && (
                                <span className="text-[10px] text-rose-500 font-medium">Cancelled</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No orders found in system.</td></tr>
                      )}

                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-sm h-full">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-primary"/> Top Products</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {loadingStats ? (
                    <div className="p-6 text-center text-muted-foreground">Loading...</div>
                  ) : stats?.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((product, idx) => (
                      <div key={product.id} className="p-4 flex items-center gap-4">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="w-12 h-12 rounded bg-muted overflow-hidden shrink-0 border">
                          {product.imageUrl ? (
                            <img src={product.imageUrl || undefined} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground/50 m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                        </div>
                        <div className="font-semibold text-sm">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">No product data available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
