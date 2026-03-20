import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { StoreProvider } from "./context/StoreContext";
import { Toaster } from "react-hot-toast";

import Header from "./components/Header";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AccountLayout from "./components/layout/account/AccountLayout";
import AdminLayout from "./components/layout/admin/AdminLayout";
import StoreLayout from "./components/layout/store/StoreLayout";
import LoadingSkeleton from "./components/LoadingSkeleton";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Cart = lazy(() => import("./pages/Cart"));
const Account = lazy(() => import("./pages/Account"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const PaymentApprovals = lazy(() => import("./pages/Admin/PaymentApprovals"));
const AllOrders = lazy(() => import("./pages/Admin/AllOrders"));
const ProductModeration = lazy(() => import("./pages/Admin/ProductModeration"));
const StoreApplications = lazy(() => import("./pages/Admin/StoreApplications"));

const Orders = lazy(() => import("./pages/Account/Orders"));
const OrderDetail = lazy(() => import("./pages/Account/OrderDetail"));

const StoreDashboard = lazy(() => import("./pages/Store/StoreDashboard"));
const StoreProducts = lazy(() => import("./pages/Store/StoreProducts"));
const ProductForm = lazy(() => import("./pages/Store/ProductForm"));
const StoreOrders = lazy(() => import("./pages/Store/StoreOrders"));
const StoreProfile = lazy(() => import("./pages/Store/StoreProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AffiliateLanding = lazy(() => import("./pages/Store/AffiliateLanding"));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <StoreProvider>
                <div className="min-h-screen flex flex-col font-sans">
                  <Header />
                  <main className="flex-grow bg-gray-50">
                    <Suspense fallback={<LoadingSkeleton />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/afiliate" element={<AffiliateLanding />} />
                        <Route path="/cart" element={<Cart />} />
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
                        {/* Admin Routes (Nested Layout) */}
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
                          <Route path="payment-approvals" element={<PaymentApprovals />} />
                          <Route path="orders" element={<AllOrders />} />
                          <Route path="product-moderation" element={<ProductModeration />} />
                          <Route path="store-applications" element={<StoreApplications />} />
                        </Route>

                        {/* Store Dashboard Routes (Nested Layout) */}
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
                          <Route path="orders" element={<StoreOrders />} />
                          <Route path="profile" element={<StoreProfile />} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>

                  <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                      <p className="text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} DentalMarket MVP.
                        Todos los derechos reservados.
                      </p>
                    </div>
                  </footer>
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
                </div>
              </StoreProvider>
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </Router>
  );
}
