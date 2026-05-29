import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import PaymentPage from "@/pages/PaymentPage";

// Pages
import Home from "@/pages/home";
import Categories from "@/pages/categories";
import CategoryDetail from "@/pages/category-detail";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import CatalogMappingWorkspace from "@/pages/admin-mapping";
import VendorDashboard from "@/pages/vendor";
import RazorpayPage from "@/pages/razorpaypage";
import Tracking from "./pages/Tracking";
import PaymentSuccess from "@/pages/payment-success";
import PaymentFailure from "@/pages/payment-failure";
import About from "@/pages/about";
import Wishlist from "@/pages/wishlist";
import Orders from "@/pages/orders";
import Rewards from "@/pages/rewards";
import Referral from "@/pages/referral";
import Addresses from "@/pages/addresses";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={Categories} />
      <Route path="/categories/:id" component={CategoryDetail} />
      
      {/* ✅ FIXED PRODUCTS ROUTE WITH KEY REMOUNTING */}
      <Route
        path="/products"
        component={(props) => (
          <Products key={window.location.search} {...props} />
        )}
      />
      
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/mapping" component={CatalogMappingWorkspace} />
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/razorpay" component={RazorpayPage} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/payment/failure" component={PaymentFailure} />
      <Route path="/about" component={About} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/orders" component={Orders} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/referral" component={Referral} />
      <Route path="/addresses" component={Addresses} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster position="top-center" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;