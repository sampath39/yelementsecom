import { AppLayout } from "@/components/layout/app-layout";
import { useGetCart, getGetCartQueryKey, useUpdateCartItem, useRemoveFromCart, useClearCart } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Cart() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: cart, isLoading } = useGetCart({
    query: { 
      queryKey: getGetCartQueryKey(),
      enabled: !!user
    }
  });

  const updateItemMutation = useUpdateCartItem();
  const removeItemMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();

  const handleUpdateQuantity = (productId: number, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxStock) {
      toast.error("Not enough stock available");
      return;
    }
    
    updateItemMutation.mutate(
      { productId, data: { quantity: newQuantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        }
      }
    );
  };

  const handleRemoveItem = (productId: number) => {
    removeItemMutation.mutate(
      { productId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast.success("Item removed from cart");
        }
      }
    );
  };

  const handleMoveToWishlist = (productId: number) => {
    const token = localStorage.getItem("yelements_token") || localStorage.getItem("token") || "";
    const apiUrl = import.meta.env.VITE_API_URL || "";

    fetch(`${apiUrl}/api/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        toast.success("Saved for later (Moved to Wishlist)");
        removeItemMutation.mutate({ productId }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
        });
      })
      .catch(() => {
        toast.error("Failed to move to wishlist");
      });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Please login to view cart</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to add items to your cart and checkout.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <AppLayout>
      {/* Premium Shopping Cart Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white py-16 px-4 border-b border-slate-900 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_60%)]" />
        <div className="container mx-auto max-w-6xl relative z-10 text-center space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest">
            Institutional Procurement
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            My Shopping <span className="text-teal-400">Procurement Cart</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Review and adjust your selected scientific, surgical, or office essentials before securing institutional order delivery.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-4 max-w-6xl">
        
        {isEmpty ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
            <div className="w-20 h-20 bg-background border shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added any supplies yet.</p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                  <h3 className="font-semibold">Items ({cart.itemCount})</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your cart?")) {
                        clearCartMutation.mutate(undefined, {
                          onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
                        });
                      }
                    }}
                  >
                    Clear Cart
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="w-24 h-24 shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.productId}`} className="font-medium text-lg hover:text-primary transition-colors line-clamp-2 mb-1">
                          {item.name}
                        </Link>
                        <div className="text-accent font-bold text-lg mb-4 sm:mb-0">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 sm:gap-4">
                        <div className="flex items-center border rounded-md bg-background">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none border-r"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.stock)}
                            disabled={item.quantity <= 1 || updateItemMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-12 text-center text-sm font-medium">
                            {item.quantity}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none border-l"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.stock)}
                            disabled={item.quantity >= item.stock || updateItemMutation.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right sm:w-24 font-semibold shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 shrink-0 mr-1"
                          onClick={() => handleMoveToWishlist(item.productId)}
                          title="Save for Later"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                          onClick={() => handleRemoveItem(item.productId)}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({cart.itemCount} items)</span>
                      <span>{formatPrice(cart.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxes</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between font-bold text-lg text-foreground">
                      <span>Estimated Total</span>
                      <span className="text-primary">{formatPrice(cart.subtotal)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-12 text-base bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" 
                    asChild
                  >
                    <Link href="/checkout">
                      Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  
                  <div className="mt-4 text-center">
                    <Link href="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Continue Shopping
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
