import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CreateProduct from "./pages/CreateProduct";
import MyProducts from "./pages/MyProducts";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminProducts from "./pages/AdminProducts";
import AdminAllProducts from "./pages/AdminAllProducts";
import AdminCategories from "./pages/AdminCategories";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import Policy from "./pages/Policy";
import Messages from "./pages/Messages";
import EditProduct from "./pages/EditProduct";
import { Terms } from "./pages/Terms";
import Footer from "./components/Footer";
import AdminBanners from "./pages/AdminBanners";
import AdminNativeAds from "./pages/AdminNativeAds";
import AdminAdAnalytics from "./pages/AdminAdAnalytics";

function Router() {
  // Route order matters: specific routes must come before dynamic ones
  // /products/create must come before /products/:id to avoid being matched as a product ID
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/products"} component={ProductList} />
      <Route path={"/products/create"} component={CreateProduct} />
      <Route path={"/products/:id/edit"} component={EditProduct} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/orders/:id/confirmation"} component={OrderConfirmation} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/policy"} component={Policy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/products/:id"} component={ProductDetail} />
      <Route path={"/my-products"} component={MyProducts} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={AdminUsers} />
      <Route path={"/admin/products"} component={AdminProducts} />
      <Route path={"/admin/all-products"} component={AdminAllProducts} />
      <Route path={"/admin/categories"} component={AdminCategories} />
      <Route path={"/admin/banners"} component={AdminBanners} />
      <Route path={"/admin/native-ads"} component={AdminNativeAds} />
      <Route path={"/admin/ad-analytics"} component={AdminAdAnalytics} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
          </Switch>
        </div>
        <Footer />
      </div>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
