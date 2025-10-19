import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// 🧩 Admin (Wholesaler) pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/AdminOrders";
import Users from "./pages/admin/Users";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";

// 🛍️ Storefront (Customer-facing) pages
import Storefront from "./pages/store/Storefront";
import Cart from "./pages/store/Cart";
import Checkout from "./pages/store/Checkout";
import ThankYou from "./pages/store/ThankYou";
import CustomerOrders from "./pages/store/CustomerOrders";
import OrderDetails from "./pages/store/OrderDetails"; // ✅ new import

// 🔐 Wholesaler Auth pages
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";

// 👥 Customer Auth pages
import CustomerSignUp from "./pages/store/CustomerSignUp";
import CustomerLogin from "./pages/store/CustomerLogin";

// ⚙️ Context Providers
import { AuthProvider } from "./pages/auth/AuthContext";
import { CustomerAuthProvider } from "./pages/auth/CustomerAuthContext";
import { CartProvider } from "./context/CartContext";

// 🔒 Route Guards
import PrivateRoute from "./components/PrivateRoute";
import StorefrontProtectedRoute from "./components/StorefrontProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <Routes>
              {/* 🏠 Default redirect */}
              <Route path="/" element={<Navigate to="/login" />} />

              {/* 🔑 Wholesaler Auth */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />

              {/* 🧭 Protected Admin Routes */}
              <Route
                path="/admin/:slug"
                element={
                  <PrivateRoute>
                    <AdminLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />} />
                <Route path="add-product" element={<AddProduct />} />
                <Route path="edit-product/:id" element={<EditProduct />} />
              </Route>

              {/* 🛒 Storefront Routes (Customer side) */}
              <Route
                path="/store/:slug"
                element={
                  <StorefrontProtectedRoute>
                    <Storefront />
                  </StorefrontProtectedRoute>
                }
              />
              <Route
                path="/store/:slug/cart"
                element={
                  <StorefrontProtectedRoute>
                    <Cart />
                  </StorefrontProtectedRoute>
                }
              />
              <Route
                path="/store/:slug/checkout"
                element={
                  <StorefrontProtectedRoute>
                    <Checkout />
                  </StorefrontProtectedRoute>
                }
              />
              <Route
                path="/store/:slug/orders"
                element={
                  <StorefrontProtectedRoute>
                    <CustomerOrders />
                  </StorefrontProtectedRoute>
                }
              />
              {/* ✅ New route for viewing single order details */}
              <Route
                path="/store/:slug/orders/:orderId"
                element={
                  <StorefrontProtectedRoute>
                    <OrderDetails />
                  </StorefrontProtectedRoute>
                }
              />
              <Route
                path="/store/:slug/thank-you"
                element={
                  <StorefrontProtectedRoute>
                    <ThankYou />
                  </StorefrontProtectedRoute>
                }
              />

              {/* 👤 Customer Authentication (per store) */}
              <Route path="/store/:slug/signup" element={<CustomerSignUp />} />
              <Route path="/store/:slug/login" element={<CustomerLogin />} />

              {/* 🚫 Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
