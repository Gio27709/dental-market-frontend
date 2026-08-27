import { lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { StoreProvider } from "./context/StoreContext";
import { LocationProvider } from "./context/LocationContext";
import { FavoriteProvider } from "./context/FavoriteContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import AccountLayout from "./components/layout/account/AccountLayout";
import AdminLayout from "./components/layout/admin/AdminLayout";
import StoreLayout from "./components/layout/store/StoreLayout";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Landing from "./pages/Landing";
import { usePageTracking } from "./hooks/usePageTracking";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Cart = lazy(() => import("./pages/Cart"));
const Account = lazy(() => import("./pages/Account"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const PaymentApprovals = lazy(() => import("./pages/Admin/PaymentApprovals"));
const AllOrders = lazy(() => import("./pages/Admin/AllOrders"));
const AdminOrderDetail = lazy(() => import("./pages/Admin/AdminOrderDetail"));
const ProductModeration = lazy(() => import("./pages/Admin/ProductModeration"));
const StoreApplications = lazy(() => import("./pages/Admin/StoreApplications"));
const AdminRiderApplications = lazy(() => import("./pages/Admin/AdminRiderApplications"));
const AdminCourses = lazy(() => import("./pages/Admin/AdminCourses"));
const AdminPosts = lazy(() => import("./pages/Admin/AdminPosts"));
const AdminPostStats = lazy(() => import("./pages/Admin/AdminPostStats"));
const CategoryManagement = lazy(() => import("./pages/Admin/CategoryManagement"));
const PlatformSettings = lazy(() => import("./pages/Admin/PlatformSettings"));
const AdminNewsletter = lazy(() => import("./pages/Admin/AdminNewsletter"));
const AdminNotifications = lazy(() => import("./pages/Admin/AdminNotifications"));
const HomeContentManager = lazy(() => import("./pages/Admin/HomeContentManager"));
const PaymentHistory = lazy(() => import("./pages/Admin/PaymentHistory"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/Admin/AdminAnalytics"));
const AdminSalesAnalyticsDetail = lazy(() => import("./pages/Admin/AdminSalesAnalyticsDetail"));
const AdminRefunds = lazy(() => import("./pages/Admin/AdminRefunds"));
const AdminPenalties = lazy(() => import("./pages/Admin/AdminPenalties"));
const AdminPayouts = lazy(() => import("./pages/Admin/AdminPayouts"));
const AdminSupport = lazy(() => import("./pages/Admin/AdminSupport"));
const AdminPromotions = lazy(() => import("./pages/Admin/AdminPromotions"));
const ProfessionalVerification = lazy(() => import("./pages/Account/ProfessionalVerification"));
const ProfessionalVerifications = lazy(() => import("./pages/Admin/ProfessionalVerifications"));

const Orders = lazy(() => import("./pages/Account/Orders"));
const OrderDetail = lazy(() => import("./pages/Account/OrderDetail"));
const Favorites = lazy(() => import("./pages/Account/Favorites"));
const Downloads = lazy(() => import("./pages/Account/Downloads"));
const AccountReviews = lazy(() => import("./pages/Account/Reviews"));
const Notifications = lazy(() => import("./pages/Account/Notifications"));
const AccountPassword = lazy(() => import("./pages/Account/AccountPassword"));
const Addresses = lazy(() => import("./pages/Account/Addresses"));
const PaymentMethods = lazy(() => import("./pages/Account/PaymentMethods"));
const Support = lazy(() => import("./pages/Account/Support"));
const UserPosts = lazy(() => import("./pages/Account/UserPosts"));

const StoreDashboard = lazy(() => import("./pages/Store/StoreDashboard"));
const StoreProducts = lazy(() => import("./pages/Store/StoreProducts"));
const ProductForm = lazy(() => import("./pages/Store/ProductForm"));
const StoreOrders = lazy(() => import("./pages/Store/StoreOrders"));
const StoreRiders = lazy(() => import("./pages/Store/StoreRiders"));
const StoreProfile = lazy(() => import("./pages/Store/StoreProfile"));
const StorePenalties = lazy(() => import("./pages/Store/StorePenalties"));
const StoreWallet = lazy(() => import("./pages/Store/StoreWallet"));
const ProductStats = lazy(() => import("./pages/Store/ProductStats"));
const StoreDiscounts = lazy(() => import("./pages/Store/StoreDiscounts"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AffiliateLanding = lazy(() => import("./pages/Store/AffiliateLanding"));
const StoreCatalog = lazy(() => import("./pages/StoreCatalog"));
const Courses = lazy(() => import("./pages/Courses/Courses"));
const Contact = lazy(() => import("./pages/Contact"));
const Promotions = lazy(() => import("./pages/Promotions"));
const RiderLayout = lazy(() => import("./components/layout/RiderLayout"));
const RiderDashboard = lazy(() => import("./pages/Rider/RiderDashboard"));
const CourseDetail = lazy(() => import("./pages/Courses/CourseDetail"));
const Blog = lazy(() => import("./pages/News/Blog"));
const PostDetail = lazy(() => import("./pages/News/PostDetail"));
const StorePublicProfile = lazy(() => import("./pages/StorePublicProfile"));
const UserPublicProfile = lazy(() => import("./pages/UserPublicProfile"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));

const ClinicLayout = lazy(() => import("./pages/Clinic/ClinicLayout"));
const ClinicDashboard = lazy(() => import("./pages/Clinic/ClinicDashboard"));
const ClinicInventory = lazy(() => import("./pages/Clinic/ClinicInventory"));
const ClinicSubscriptions = lazy(() => import("./pages/Clinic/ClinicSubscriptions"));
const ClinicProfitability = lazy(() => import("./pages/Clinic/ClinicProfitability"));


/** Emite page_view en cada navegación. Sin render propio; vive dentro del Router. */
function PageTracker() {
  usePageTracking();
  return null;
}

function EcommerceLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * En `/`: la primera visita ve la landing de bienvenida; después, la Home de siempre.
 * Se decide una sola vez al montar para no parpadear entre las dos.
 */
function HomeGate() {
  const [seen] = useState(() => {
    try {
      return localStorage.getItem("forcepx_welcome_seen") === "1";
    } catch {
      return true;
    }
  });

  return seen ? <Home /> : <Landing />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <PageTracker />
      <LocationProvider>
        <AuthProvider>
          <ProductProvider>
            <CurrencyProvider>
            <FavoriteProvider>
              <CartProvider>
              <OrderProvider>
                <StoreProvider>
                <NotificationProvider>
                  <Suspense fallback={<LoadingSkeleton />}>
                    <Routes>
                      {/* --- RUTAS PRIVADAS / PANELES INTERNOS (Sin Header/Footer públicos) --- */}
                      
                      {/* Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute
                            redirectTo="/login"
                            requiredRole={["admin", "owner"]}
                          >
                            <AdminLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<AdminDashboard />} />
                        <Route path="analytics" element={<AdminAnalytics />} />
                        <Route path="analytics/sales-detail" element={<AdminSalesAnalyticsDetail />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="payment-approvals" element={<PaymentApprovals />} />
                        <Route path="orders" element={<AllOrders />} />
                        <Route path="orders/:id" element={<AdminOrderDetail />} />
                        <Route path="refunds" element={<AdminRefunds />} />
                        <Route path="penalties" element={<AdminPenalties />} />
                        <Route path="payouts" element={<AdminPayouts />} />
                        <Route path="payment-history" element={<PaymentHistory />} />
                        <Route path="product-moderation" element={<ProductModeration />} />
                        <Route path="store-applications" element={<StoreApplications />} />
                        <Route path="rider-applications" element={<AdminRiderApplications />} />
                        <Route path="categories" element={<CategoryManagement />} />
                        <Route path="courses" element={<AdminCourses />} />
                        <Route path="posts" element={<AdminPosts />} />
                        <Route path="posts/:id/stats" element={<AdminPostStats />} />
                        <Route path="settings" element={<PlatformSettings />} />
                        <Route path="newsletter" element={<AdminNewsletter />} />
                        <Route path="notifications" element={<AdminNotifications />} />
                        <Route path="home-content" element={<HomeContentManager />} />
                        <Route path="support" element={<AdminSupport />} />
                        <Route path="promotions" element={<AdminPromotions />} />
                        <Route path="professional-verifications" element={<ProfessionalVerifications />} />
                      </Route>

                      {/* Rider Dashboard Routes */}
                      <Route
                        path="/delivery"
                        element={
                          <ProtectedRoute
                            redirectTo="/login"
                            requiredRole={["delivery", "owner"]}
                          >
                            <RiderLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<RiderDashboard />} />
                      </Route>

                      {/* Store Dashboard Routes */}
                      <Route
                        path="/store"
                        element={
                          <ProtectedRoute
                            redirectTo="/login"
                            requiredRole={["store", "owner"]}
                          >
                            <StoreLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<StoreDashboard />} />
                        <Route path="products" element={<StoreProducts />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route
                          path="products/edit/:id"
                          element={<ProductForm />}
                        />
                        <Route
                          path="products/:id/stats"
                          element={<ProductStats />}
                        />
                        <Route path="orders" element={<StoreOrders />} />
                        <Route path="wallet" element={<StoreWallet />} />
                        <Route path="analytics" element={<StoreDashboard />} />
                        <Route path="riders" element={<StoreRiders />} />
                        <Route path="profile" element={<StoreProfile />} />
                        <Route path="penalties" element={<StorePenalties />} />
                        <Route path="discounts" element={<StoreDiscounts />} />
                      </Route>

                      {/* Clinic Portal Routes */}
                      <Route
                        path="/clinic"
                        element={
                          <ProtectedRoute redirectTo="/login" requiredRole={["user", "professional", "student"]}>
                            <ClinicLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<ClinicDashboard />} />
                        <Route path="inventory" element={<ClinicInventory />} />
                        <Route path="subscriptions" element={<ClinicSubscriptions />} />
                        <Route path="profitability" element={<ClinicProfitability />} />
                      </Route>


                      {/* --- RUTAS PÚBLICAS / CLIENTE (Con Header y Footer de E-commerce) --- */}
                      <Route element={<EcommerceLayout />}>
                        <Route path="/" element={<HomeGate />} />
                        <Route path="/inicio" element={<Home />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/update-password" element={<UpdatePassword />} />
                        <Route path="/afiliate" element={<AffiliateLanding />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/contacto" element={<Contact />} />
                        <Route path="/promociones" element={<Promotions />} />
                        <Route path="/acerca" element={<AboutUs />} />
                        <Route path="/privacidad" element={<PrivacyPolicy />} />
                        <Route path="/devoluciones" element={<RefundPolicy />} />
                        <Route path="/terminos" element={<TermsConditions />} />
                        <Route path="/store-catalog" element={<StoreCatalog />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/courses/:id" element={<CourseDetail />} />
                        <Route path="/news" element={<Blog />} />
                        <Route path="/news/:id" element={<PostDetail />} />
                        <Route path="/store/:id" element={<StorePublicProfile />} />
                        <Route path="/user/:id" element={<UserPublicProfile />} />
                        
                        {/* Account Routes (Nested Layout) */}
                        <Route
                          path="/account"
                          element={
                            <ProtectedRoute redirectTo="/login">
                              <AccountLayout />
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<Account />} />
                          <Route path="orders" element={<Orders />} />
                          <Route path="orders/:id" element={<OrderDetail />} />
                          <Route path="favorites" element={<Favorites />} />
                          <Route path="downloads" element={<Downloads />} />
                          <Route path="reviews" element={<AccountReviews />} />
                          <Route path="notifications" element={<Notifications />} />
                          <Route path="password" element={<AccountPassword />} />
                          <Route path="addresses" element={<Addresses />} />
                          <Route path="payment-methods" element={<PaymentMethods />} />
                          <Route path="support" element={<Support />} />
                          <Route path="posts" element={<UserPosts />} />
                          <Route path="professional-verification" element={<ProfessionalVerification />} />
                        </Route>

                        <Route
                          path="/checkout"
                          element={
                            <ProtectedRoute redirectTo="/login">
                              <Checkout />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/order-success/:id"
                          element={
                            <ProtectedRoute redirectTo="/login">
                              <OrderSuccess />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </Suspense>

                  <Toaster
                    position="bottom-center"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: "#333",
                        color: "#fff",
                      },
                    }}
                  />
                </NotificationProvider>
                </StoreProvider>
              </OrderProvider>
              </CartProvider>
            </FavoriteProvider>
            </CurrencyProvider>
          </ProductProvider>
        </AuthProvider>
      </LocationProvider>
    </Router>
  );
}
