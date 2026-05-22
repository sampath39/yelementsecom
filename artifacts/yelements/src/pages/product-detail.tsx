import { AppLayout } from "@/components/layout/app-layout";
import { 
  useGetProduct, 
  getGetProductQueryKey, 
  useAddToCart, 
  getGetCartQueryKey, 
  useGetProductReviews, 
  getGetProductReviewsQueryKey, 
  useCreateReview 
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  ShoppingCart, 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  Heart, 
  Info, 
  Box, 
  Flame, 
  Users, 
  Gift, 
  HelpCircle, 
  Compass, 
  Tag, 
  Share2, 
  RotateCw, 
  Check,
  CheckCircle2,
  Package
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// 📝 Define interfaces for type-safety
interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  imageUrl?: string;
  categoryName?: string;
  categoryId?: number;
  subcategory?: string;
  vendorName?: string;
  rating?: number;
  reviewCount?: number;
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // 🏪 Local State for Gamified & Advanced E-commerce Features
  const [viewersCount, setViewersCount] = useState(27);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">("one-time");
  const [giftWrapped, setGiftWrapped] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // 🔨 Auction Portal States
  const [highestBid, setHighestBid] = useState(6200);
  const [userBid, setUserBid] = useState(6400);
  const [bidHistory, setBidHistory] = useState([
    { name: "Fortis Healthcare Ltd", bid: 6000, time: "4 mins ago" },
    { name: "Max Medical Solutions", bid: 5800, time: "15 mins ago" },
    { name: "Global Lab Supplies", bid: 5500, time: "1 hour ago" },
  ]);

  // 👥 Group Buying Referral State
  const [groupSpotsFilled, setGroupSpotsFilled] = useState(1);
  const [groupActive, setGroupActive] = useState(false);

  // 🎡 Lucky Spin the Wheel States
  const [spinWheelOpen, setSpinWheelOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wonCoupon, setWonCoupon] = useState<string | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // 🕰️ Recently Viewed State
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  // 🔄 360 View State
  const [is360View, setIs360View] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);

  // 🚚 Delivery Checker State
  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<{status: 'idle' | 'checking' | 'success' | 'error', message: string}>({ status: 'idle', message: '' });

  // 📥 Fetch API endpoints
  const { data: productData, isLoading: loadingProduct } = useGetProduct(productId, {
    query: { 
      queryKey: getGetProductQueryKey(productId),
      enabled: !!productId 
    }
  });

  const product = productData as Product | undefined;

  const { data: reviewsData } = useGetProductReviews(productId, {
    query: {
      queryKey: getGetProductReviewsQueryKey(productId),
      enabled: !!productId
    }
  });

  const reviews = reviewsData as Review[] | undefined;

  const addToCartMutation = useAddToCart();
  const createReviewMutation = useCreateReview();

  // 🕰️ Recently Viewed & Live Viewers Effects
  useEffect(() => {
    // Increment/decrement live viewers randomly to simulate real-time traffic
    const viewerInterval = setInterval(() => {
      setViewersCount((prev) => Math.max(12, Math.min(68, prev + (Math.random() > 0.5 ? 2 : -2))));
    }, 6000);

    return () => clearInterval(viewerInterval);
  }, []);

  // Save current product to recently viewed list
  useEffect(() => {
    if (!product) return;
    try {
      const stored = localStorage.getItem("recently_viewed");
      const list: Product[] = stored ? JSON.parse(stored) : [];
      
      // Filter out existing duplicates
      const filtered = list.filter((item) => item.id !== product.id);
      // Append current product to the top
      const updated = [product, ...filtered].slice(0, 4);
      
      localStorage.setItem("recently_viewed", JSON.stringify(updated));
      setRecentProducts(updated.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error("Error setting recently viewed list", err);
    }
  }, [product]);

  // Sync Bidding details once the product price loads
  useEffect(() => {
    if (product) {
      const startBid = Math.round(product.price * 0.95);
      setHighestBid(startBid);
      setUserBid(startBid + 200);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Apply subscription discount or gift wrap cost if chosen
    const finalQuantity = quantity;
    
    addToCartMutation.mutate(
      { data: { productId: product.id, quantity: finalQuantity } },
      {
        onSuccess: () => {
          let successMsg = `${quantity}x ${product.name} added to cart!`;
          if (purchaseType === "subscription") {
            successMsg += " (Subscribed for Monthly Delivery - 10% Off)";
          }
          if (giftWrapped) {
            successMsg += " (Includes Premium Gift Wrap)";
          }
          toast.success("Added to Cart 🛒", {
            description: successMsg,
          });
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        },
        onError: () => {
          toast.error("Failed to add to cart", {
            description: "Please log in to manage your shopping cart.",
          });
        }
      }
    );
  };

  // 🔨 Auction Place Bid Logic
  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Must be logged in to bid on live products");
      return;
    }
    if (userBid <= highestBid) {
      toast.error(`Bid amount must be greater than current highest bid of ₹${highestBid}`);
      return;
    }

    setHighestBid(userBid);
    setBidHistory((prev) => [
      { name: user.name + " (You)", bid: userBid, time: "Just now" },
      ...prev,
    ]);
    setUserBid(userBid + 200);
    toast.success("Live Bid Placed Successfully! 🔨", {
      description: `You are currently the highest bidder at ₹${userBid}.`,
    });
  };

  // 👥 Group Buying Referral Link Copying
  const handleStartGroup = () => {
    setGroupActive(true);
    setGroupSpotsFilled(2);
    const mockRefUrl = `${window.location.origin}/products/${productId}?group=YEL-${Math.random().toString(36).substring(4).toUpperCase()}`;
    navigator.clipboard.writeText(mockRefUrl);
    toast.success("Buying Group Activated! 👥", {
      description: "Referral discount link copied to clipboard. Share with your peers to get group discounts!",
    });
  };

  // 🎡 Spin Wheel daily rewards coupons selection
  const handleSpinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    
    // Choose a random angle (e.g. 5 full spins + extra degrees)
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalRotation = rotationDegrees + 1800 + extraDegrees;
    setRotationDegrees(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      const options = ["DAILY50", "FREESHIP", "B2BMEGA", "CASHBACK10", "SUPPLY15"];
      const reward = options[Math.floor(Math.random() * options.length)];
      setWonCoupon(reward);
      navigator.clipboard.writeText(reward);
      toast.success(`🎉 You Won: ${reward}!`, {
        description: "Coupon code has been copied to your clipboard. Apply it at checkout for huge B2B rewards!",
      });
    }, 3000);
  };

  // 📄 Review submit
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Must be logged in to write a review");
      return;
    }
    
    createReviewMutation.mutate(
      { id: productId, data: { rating: reviewRating, comment: reviewComment } },
      {
        onSuccess: () => {
          toast.success("Review submitted!");
          setReviewComment("");
          queryClient.invalidateQueries({ queryKey: getGetProductReviewsQueryKey(productId) });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
        }
      }
    );
  };

  // 🔄 Pre-order booking
  const handlePreOrder = () => {
    toast.success("Pre-Order Confirmed! 📦", {
      description: `Successfully reserved 1x "${product?.name}". We will notify you and auto-ship as soon as inventory arrives.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) {
      setDeliveryStatus({ status: 'error', message: 'Please enter a valid 6-digit pincode' });
      return;
    }
    setDeliveryStatus({ status: 'checking', message: 'Checking delivery availability...' });
    setTimeout(() => {
      if (pincode.startsWith("1") || pincode.startsWith("4")) {
        setDeliveryStatus({ status: 'success', message: 'Next Day Delivery available to this location! 🚀' });
      } else {
        setDeliveryStatus({ status: 'success', message: 'Standard Delivery (3-5 days) available.' });
      }
    }, 1500);
  };

  if (loadingProduct) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-4 w-1/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full max-w-sm" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Button asChild className="mt-4">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8 relative">
        
        {/* 🎡 FLOATING SPIN WHEEL DAILY REWARD LAUNCHER */}
        <button
          onClick={() => setSpinWheelOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group"
          title="Daily Spin Rewards"
        >
          <RotateCw className="w-6 h-6 animate-spin-slow group-hover:rotate-180 transition-all duration-500" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out text-sm font-bold tracking-wide whitespace-nowrap">
            Spin Wheel! 🎁
          </span>
        </button>

        {/* 🎡 SPIN WHEEL DIALOG DRAWER */}
        {spinWheelOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative animate-scale-up text-center">
              <button 
                onClick={() => setSpinWheelOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
              
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">🎁 Daily Rewards Wheel</h3>
              <p className="text-xs text-muted-foreground mb-6">Spin to win premium coupons & B2B discounts!</p>
              
              {/* Spinning wheel visualization using SVG */}
              <div className="relative w-56 h-56 mx-auto mb-6">
                <div 
                  className="w-full h-full rounded-full border-8 border-slate-800 shadow-lg overflow-hidden transition-transform duration-[3000ms] cubic-bezier(0.1, 0.8, 0.3, 1)"
                  style={{ 
                    transform: `rotate(${rotationDegrees}deg)`,
                    backgroundImage: `conic-gradient(
                      #10b981 0deg 72deg, 
                      #3b82f6 72deg 144deg, 
                      #8b5cf6 144deg 216deg, 
                      #f59e0b 216deg 288deg, 
                      #ec4899 288deg 360deg
                    )`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-bold -rotate-45">SPIN ME!</span>
                  </div>
                </div>
                {/* Pointer Indicator */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-600 rotate-45 rounded-tl-sm border-2 border-white shadow z-10" />
              </div>

              {wonCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Success! Coupon Copied</p>
                  <h4 className="text-xl font-black text-emerald-700">{wonCoupon}</h4>
                  <p className="text-[10px] text-emerald-500 mt-1">Apply code at checkout for maximum discount!</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4">Press the button below to test your luck!</p>
              )}

              <Button
                onClick={handleSpinWheel}
                disabled={spinning}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 font-bold text-base"
              >
                {spinning ? "Spinning Wheel..." : "SPIN NOW! 🎡"}
              </Button>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <Link href="/categories" className="hover:text-primary">Categories</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          {product.categoryId && (
            <>
              <Link href={`/products?category=${product.categoryName}`} className="hover:text-primary">{product.categoryName}</Link>
              <ChevronRight className="w-4 h-4 mx-1" />
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Left Column: Product Image & 360 View */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center aspect-square relative shadow-sm group">
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold z-10 shadow">
                  SAVE {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-4 right-4 z-10 gap-2 bg-background/80 backdrop-blur"
                onClick={() => setIs360View(!is360View)}
              >
                <RotateCw className={`w-4 h-4 ${is360View ? 'text-primary animate-spin' : ''}`} /> 
                {is360View ? 'Exit 360°' : '360° View'}
              </Button>

              {product.imageUrl ? (
                is360View ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="relative w-full h-full cursor-ew-resize select-none flex items-center justify-center"
                         onMouseMove={(e) => {
                           if (e.buttons === 1) {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const x = e.clientX - rect.left;
                             const percentage = x / rect.width;
                             setRotationIndex(Math.floor(percentage * 36));
                           }
                         }}>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain transition-transform duration-75"
                        style={{ transform: `rotateY(${rotationIndex * 10}deg)` }}
                        draggable="false"
                      />
                      <div className="absolute bottom-0 text-xs text-muted-foreground font-semibold bg-background/50 px-3 py-1 rounded-full pointer-events-none">
                        Drag to rotate
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="35" 
                      value={rotationIndex}
                      onChange={(e) => setRotationIndex(parseInt(e.target.value))}
                      className="w-full max-w-[200px] accent-primary"
                    />
                  </div>
                ) : (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain hover:scale-105 transition duration-500" 
                  />
                )
              ) : (
                <Box className="w-32 h-32 text-muted-foreground/30 animate-pulse" />
              )}
            </div>

            {/* 👥 B2B GROUP BUYING REFERRAL MODULE */}
            <div className="border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600/10 p-2.5 rounded-xl text-indigo-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-indigo-950 flex items-center gap-2">
                    Group Purchase Discount <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">Save 20%</span>
                  </h4>
                  <p className="text-xs text-indigo-900/70 mt-1 leading-relaxed">
                    Team up with other institutional purchasers or coordinate orders with colleagues. Share this link to get bulk group rates!
                  </p>
                  
                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 flex items-center gap-1.5 shrink-0">
                      👥 Active Spots: {groupSpotsFilled}/3 filled
                    </div>
                    
                    <Button
                      onClick={handleStartGroup}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg px-4 h-9 shadow-sm shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" /> {groupActive ? "Link Copied!" : "Create Buying Group"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Product Actions & Gamification */}
          <div className="flex flex-col">
            <div className="mb-2 text-sm text-primary font-medium tracking-wide uppercase">
              {product.vendorName || "Yelements Direct Vendor"}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
              <div className="flex items-center text-yellow-500">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (product.rating || 4.5) ? "fill-current" : "fill-muted text-muted"}`} />
                ))}
                <span className="ml-2 text-sm font-semibold text-slate-800">{product.rating ? product.rating.toFixed(1) : '4.5'}</span>
              </div>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                • {product.reviewCount || 12} Reviews
              </span>
            </div>

            {/* 👥 REALTIME URGENCY VIEWER ALERTS */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" /> Only {product.stock > 0 ? Math.min(3, product.stock) : 0} items left in stock!
              </div>
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Users className="w-4 h-4 text-emerald-500" /> {viewersCount} institutional users are viewing this now!
              </div>
            </div>

            {/* Price Box */}
            <div className="mb-6 flex items-end gap-3 bg-slate-50 border p-4 rounded-xl">
              <div>
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-muted-foreground line-through block mt-0.5">
                    Original Price: {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              
              {/* 🎁 REWARD POINTS / LOYALTY CARD */}
              <div className="ml-auto bg-emerald-600/10 border border-emerald-200/50 rounded-lg p-2.5 text-right max-w-[200px]">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center justify-end gap-1">
                  Loyalty Rewards <Gift className="w-3.5 h-3.5 text-emerald-600" />
                </p>
                <p className="text-xs font-bold text-emerald-700 mt-1">Earn {Math.round(product.price * 0.05)} Points (Value: ₹{Math.round(product.price * 0.05)})</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              {product.description || "Premium class industrial and institutional supplies engineered for seamless lab operations and durable applications."}
            </p>

            {/* Action Card Section */}
            <div className="space-y-6 mb-6 bg-slate-50/50 p-6 rounded-2xl border border-border">
              
              {/* 🔄 SUBSCRIPTION & SCHEDULE SELECTOR */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Purchase Options</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPurchaseType("one-time")}
                    className={`flex flex-col text-left p-3 border-2 rounded-xl transition duration-200 ${
                      purchaseType === "one-time" 
                        ? "border-emerald-600 bg-emerald-50/20" 
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800">One-Time purchase</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Pay standard B2B price</span>
                  </button>

                  <button
                    onClick={() => setPurchaseType("subscription")}
                    className={`flex flex-col text-left p-3 border-2 rounded-xl transition duration-200 ${
                      purchaseType === "subscription" 
                        ? "border-emerald-600 bg-emerald-50/20" 
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      Subscribe & Save <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 rounded-full">-10%</span>
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">Auto-delivery every 30 days</span>
                  </button>
                </div>
              </div>

              {/* 🎁 GIFT WRAP & packaging selector */}
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="gift-wrap"
                  checked={giftWrapped}
                  onChange={(e) => setGiftWrapped(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="gift-wrap" className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                  Add premium packaging & greeting wrap (+₹99) <Gift className="w-3.5 h-3.5 text-pink-500" />
                </label>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center border border-gray-200 rounded-xl bg-white h-12 overflow-hidden shadow-sm shrink-0">
                  <button 
                    className="px-4 text-lg font-bold text-muted-foreground hover:text-slate-800 transition-colors h-full hover:bg-gray-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || product.stock === 0}
                  >-</button>
                  <div className="w-10 text-center font-black text-base text-slate-800">{product.stock > 0 ? quantity : 0}</div>
                  <button 
                    className="px-4 text-lg font-bold text-muted-foreground hover:text-slate-800 transition-colors h-full hover:bg-gray-50"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || product.stock === 0}
                  >+</button>
                </div>
                
                {product.stock > 0 ? (
                  <Button 
                    size="lg" 
                    className="flex-1 h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow rounded-xl"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="flex-1 h-12 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow rounded-xl"
                    onClick={handlePreOrder}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Pre-Order / Back-Order
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`h-12 w-12 shrink-0 rounded-xl ${wishlisted ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200"}`}
                  onClick={() => {
                    setWishlisted(!wishlisted);
                    toast.success(wishlisted ? "Removed from wishlist" : "Added to Wishlist! ❤️", {
                      description: "We will monitor prices and alert you when price drops!"
                    });
                  }}
                >
                  <Heart className={`w-5 h-5 ${wishlisted ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>

            {/* 🚚 DELIVERY CHECKER */}
            <div className="mb-6 bg-card border rounded-2xl p-5">
              <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-primary" /> Delivery Options & Estimates
              </h4>
              <form onSubmit={handleCheckDelivery} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter 6-digit Pincode" 
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <Button type="submit" variant="secondary" className="font-semibold px-6" disabled={deliveryStatus.status === 'checking'}>
                  Check
                </Button>
              </form>
              {deliveryStatus.status !== 'idle' && (
                <p className={`text-xs mt-3 font-semibold ${deliveryStatus.status === 'error' ? 'text-destructive' : deliveryStatus.status === 'success' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {deliveryStatus.message}
                </p>
              )}
            </div>

            {/* 📄 COMPARE SPECIFICATIONS TOGGLE */}
            <div className="mt-2 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 border-dashed hover:border-slate-400 font-semibold"
                onClick={() => setComparing(!comparing)}
              >
                📊 Compare with Alternate Products
              </Button>
              
              {comparing && (
                <div className="mt-4 border rounded-xl overflow-hidden bg-white p-4 shadow-md animate-scale-up">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3">Side-by-Side Product Comparison</h4>
                  <div className="grid grid-cols-3 gap-2 text-xs border-b pb-2 mb-2 font-bold text-slate-700">
                    <div>Attribute</div>
                    <div>{product.name} (Current)</div>
                    <div>Alt-Vendor Solution</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] py-1 border-b">
                    <div className="font-medium text-slate-500">Price</div>
                    <div className="font-bold">{formatPrice(product.price)}</div>
                    <div className="text-gray-600">{formatPrice(product.price * 1.1)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] py-1 border-b">
                    <div className="font-medium text-slate-500">Ratings</div>
                    <div className="font-bold">⭐ {product.rating || '4.5'}</div>
                    <div className="text-gray-600">⭐ 4.2</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] py-1">
                    <div className="font-medium text-slate-500">B2B Shipping</div>
                    <div className="font-bold">Next-Day Cargo</div>
                    <div className="text-gray-600">3-5 Business Days</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Bulk Institutional Cargo Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified Quality Standards</span>
              </div>
            </div>

            {/* 🎁 BUNDLE OFFERS / FREQUENTLY BOUGHT TOGETHER */}
            <div className="mt-8 border border-amber-200 bg-amber-50/50 p-5 rounded-2xl">
              <h4 className="font-bold text-sm text-amber-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" /> Frequently Bought Together
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white border border-amber-100 rounded-lg p-2 shrink-0 flex items-center justify-center">
                  <img src={product.imageUrl} alt="" className="max-h-full object-contain" />
                </div>
                <div className="text-amber-600 font-bold">+</div>
                <div className="w-16 h-16 bg-white border border-amber-100 rounded-lg p-2 shrink-0 flex items-center justify-center relative">
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">SALE</div>
                  <Box className="w-8 h-8 text-amber-300" />
                </div>
                <div className="flex-1 ml-2">
                  <p className="text-xs font-bold text-amber-900">Standard Accessory Kit</p>
                  <p className="text-xs text-amber-700/80 mt-0.5">+ {formatPrice(product.price * 0.15)}</p>
                </div>
              </div>
              <Button className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-bold h-10 text-xs">
                Add Bundle to Cart & Save 15%
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="mt-16">
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 space-x-8">
              <TabsTrigger 
                value="specifications" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger 
                value="auction" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm flex items-center gap-1"
              >
                Live Bidding Auction 🔨
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 pb-3 font-bold text-sm"
              >
                Reviews ({product.reviewCount || 0})
              </TabsTrigger>
            </TabsList>
            
            {/* TAB: Specifications */}
            <TabsContent value="specifications" className="pt-6">
              <div className="bg-card border rounded-xl p-6 md:p-8 max-w-3xl">
                <h3 className="text-lg font-bold mb-4">Product Details Information</h3>
                <dl className="divide-y divide-border text-sm">
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-semibold text-slate-800">{product.categoryName}</dd>
                  </div>
                  {product.subcategory && (
                    <div className="py-3 flex justify-between">
                      <dt className="text-muted-foreground">Subcategory</dt>
                      <dd className="font-semibold text-slate-800">{product.subcategory}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground">Vendor Seller</dt>
                    <dd className="font-semibold text-slate-800">{product.vendorName || "Yelements Direct Partner"}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-muted-foreground">Item Identifier</dt>
                    <dd className="font-mono font-bold text-emerald-700">#YEL-{product.id.toString().padStart(6, '0')}</dd>
                  </div>
                </dl>
              </div>
            </TabsContent>

            {/* TAB: Live Bidding Auction System */}
            <TabsContent value="auction" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Live Auction System</p>
                        <h3 className="text-xl font-black mt-1">Place Bid to Secure Order</h3>
                      </div>
                      
                      {/* COUNTDOWN TIMER */}
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-center">
                        <span className="block text-[9px] uppercase font-black tracking-widest text-red-500">Auction Ending In</span>
                        <span className="font-mono text-base font-black">02h 45m 12s</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-400">Current Highest Bid</span>
                        <h4 className="text-4xl font-black text-emerald-400 tracking-tight mt-1">
                          {formatPrice(highestBid)}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Reserve Price Met • 3 active bidders
                        </p>
                      </div>

                      {/* PLACE BID ACTION */}
                      <form onSubmit={handlePlaceBid} className="space-y-4 bg-slate-800/40 p-5 rounded-xl border border-slate-800">
                        <label className="block text-xs font-bold text-slate-300">Your Bid (₹)</label>
                        <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setUserBid(Math.max(highestBid + 100, userBid - 100))}
                            className="px-4 py-2 text-slate-400 hover:text-white font-black"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={userBid}
                            onChange={(e) => setUserBid(Math.max(highestBid + 100, parseInt(e.target.value) || highestBid + 100))}
                            className="w-full text-center bg-transparent focus:outline-none text-white font-black text-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setUserBid(userBid + 100)}
                            className="px-4 py-2 text-slate-400 hover:text-white font-black"
                          >
                            +
                          </button>
                        </div>

                        <Button 
                          type="submit"
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-xl shadow-lg"
                        >
                          Place Live Bid 🔨
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* BID HISTORY LOG */}
                <div className="md:col-span-1">
                  <div className="bg-card border rounded-2xl p-6 h-full">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Bid History Log</h3>
                    <div className="space-y-4">
                      {bidHistory.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs py-2.5 border-b last:border-0">
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{item.time}</div>
                          </div>
                          <div className="font-black text-slate-900 text-right">
                            {formatPrice(item.bid)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* TAB: Reviews */}
            <TabsContent value="reviews" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {reviews && reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="bg-card border rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-semibold">{review.userName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex text-accent">
                            {Array(5).fill(0).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "fill-muted text-muted"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                      <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-1">
                  <div className="bg-card border rounded-xl p-6 sticky top-24">
                    <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                    {user ? (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Rating</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="text-2xl focus:outline-none"
                              >
                                <Star className={`w-6 h-6 ${star <= reviewRating ? "fill-accent text-accent" : "fill-muted text-muted"}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Comment</label>
                          <Textarea 
                            placeholder="Share your B2B purchase review with details..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={4}
                            required
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-slate-900 text-white hover:bg-slate-800"
                          disabled={createReviewMutation.isPending}
                        >
                          Submit Review
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center py-6 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-4">Log in to write a review</p>
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/login">Log In</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 🕰️ RECENTLY VIEWED PRODUCTS SLIDER */}
        {recentProducts.length > 0 && (
          <div className="mt-20 border-t pt-12">
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-emerald-600" /> Recently Viewed Products
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recentProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="group block bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                  <div className="aspect-square bg-slate-50/50 rounded-lg overflow-hidden flex items-center justify-center p-4 mb-3">
                    <img src={p.imageUrl} alt={p.name} className="h-full object-contain group-hover:scale-105 transition duration-300" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 h-8 group-hover:text-primary transition">{p.name}</h4>
                  <p className="text-xs font-black text-slate-900 mt-2">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
