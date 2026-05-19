import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/lib/auth";
import {
  useGetVendorStats,
  getGetVendorStatsQueryKey,
  useCreateProduct,
  useGetCategories,
  getGetProductsQueryKey,
  getGetFeaturedProductsQueryKey,
} from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Store,
  ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const addProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  showMRP: z.boolean().default(false),
  originalPrice: z.coerce.number().positive("MRP must be a positive number").optional(),
  brand: z.string().min(1, "Brand is required"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  categoryId: z.coerce.number().min(1, "Please select a category"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
}).refine(data => {
  if (data.showMRP && data.originalPrice) {
    return Number(data.originalPrice) > Number(data.price);
  }
  return true;
}, {
  message: "MRP (original price) must be greater than the selling price",
  path: ["originalPrice"],
});

type AddProductValues = z.infer<typeof addProductSchema>;

export default function VendorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);

  const { data: stats, isLoading } = useGetVendorStats(user?.id ?? 0, {
    query: {
      queryKey: getGetVendorStatsQueryKey(user?.id ?? 0),
      enabled: user?.role === "vendor" && !!user?.id,
    },
  });

  const { data: categories } = useGetCategories();

  const createProductMutation = useCreateProduct();

  const form = useForm<AddProductValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      showMRP: false,
      originalPrice: undefined,
      brand: "",
      imageUrl: "",
      categoryId: 0,
      description: "",
      stock: 0,
    },
  });

  const watchImageUrl = form.watch("imageUrl");

  const openDialog = () => {
    form.reset();
    setShowAddProduct(true);
  };

  const onSubmit = (values: AddProductValues) => {
    const fullDescription = `Brand: ${values.brand}. ${values.description}`;
    createProductMutation.mutate(
      {
        data: {
          name: values.name,
          price: values.price,
          originalPrice: values.showMRP ? values.originalPrice : undefined,
          description: fullDescription,
          categoryId: values.categoryId,
          imageUrl: values.imageUrl,
          images: [values.imageUrl],
          stock: values.stock,
        },
      },
      {
        onSuccess: (product) => {
          toast.success("Product added!", {
            description: `"${product.name}" is now live in the store.`,
          });
          queryClient.invalidateQueries({ queryKey: getGetVendorStatsQueryKey(user?.id ?? 0) });
          queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: getGetFeaturedProductsQueryKey() });
          setShowAddProduct(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to add product", {
            description: "Please check your details and try again.",
          });
        },
      },
    );
  };

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "vendor") {
    setLocation("/dashboard");
    return null;
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);

  return (
    <AppLayout>
      <div className="bg-primary/5 py-8 border-b border-primary/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h1>
                <p className="text-muted-foreground">Vendor Portal</p>
              </div>
            </div>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={openDialog}
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {isLoading
            ? Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            : stats && (
                <>
                  <Card className="border-border shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Sales
                        </p>
                        <h3 className="text-3xl font-bold text-foreground">
                          {formatPrice(stats.totalRevenue)}
                        </h3>
                      </div>
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Active Products
                        </p>
                        <h3 className="text-3xl font-bold text-foreground">
                          {stats.totalProducts}
                        </h3>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Package className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Total Orders
                        </p>
                        <h3 className="text-3xl font-bold text-foreground">
                          {stats.totalOrders}
                        </h3>
                      </div>
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor's Products */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your inventory</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">View Live</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading products...
                  </div>
                ) : stats?.products && stats.products.length > 0 ? (
                  stats.products.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-14 h-14 rounded bg-muted overflow-hidden shrink-0 border">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-muted-foreground/50 m-auto mt-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-foreground">
                            {formatPrice(product.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Stock:{" "}
                            <span
                              className={
                                product.stock < 10
                                  ? "text-destructive font-medium"
                                  : "text-primary"
                              }
                            >
                              {product.stock}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center border-dashed border rounded-lg m-4">
                    <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      You haven't listed any products yet.
                    </p>
                    <Button onClick={openDialog}>
                      <Plus className="w-4 h-4 mr-2" /> Create First Product
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b">
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders for your products</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading orders...
                  </div>
                ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-sm">
                          Order #YEL-{order.id.toString().padStart(6, "0")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1 bg-background border rounded-md p-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground line-clamp-1 mr-4">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Product
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Premium A4 Notebooks – Pack of 10"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brand">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  placeholder="e.g. Classmate, 3M, Surgitek"
                  {...form.register("brand")}
                />
                {form.formState.errors.brand && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.brand.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="299"
                  {...form.register("price")}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2 flex flex-col justify-center border p-3 rounded-lg bg-emerald-50/30 border-emerald-100">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showMRP"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    {...form.register("showMRP")}
                  />
                  <Label htmlFor="showMRP" className="font-semibold text-slate-700 cursor-pointer text-xs">
                    Show MRP (Strikethrough) to attract customers
                  </Label>
                </div>
                {form.watch("showMRP") && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="originalPrice" className="text-xs">
                      Original Price / MRP (₹) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 399 (must be higher than selling price)"
                      {...form.register("originalPrice")}
                    />
                    {form.formState.errors.originalPrice && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.originalPrice.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(val) =>
                    form.setValue("categoryId", Number(val))
                  }
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock">
                  Stock Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  placeholder="100"
                  {...form.register("stock")}
                />
                {form.formState.errors.stock && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.stock.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="imageUrl">
                  Image URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://images.unsplash.com/photo-..."
                  {...form.register("imageUrl")}
                />
                {form.formState.errors.imageUrl && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.imageUrl.message}
                  </p>
                )}
                {watchImageUrl && !form.formState.errors.imageUrl && (
                  <div className="mt-2 relative w-full h-40 rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={watchImageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
                {(!watchImageUrl || form.formState.errors.imageUrl) && (
                  <div className="mt-2 w-full h-24 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-6 h-6 mr-2" />
                    <span className="text-sm">
                      Image preview will appear here
                    </span>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Describe the product, its uses, specifications, pack size, etc."
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddProduct(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-w-[140px]"
                disabled={createProductMutation.isPending}
              >
                {createProductMutation.isPending
                  ? "Adding Product..."
                  : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
