import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Admin (wholesaler) pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";

// Storefront (customer) pages
import Storefront from "./pages/store/Storefront";
import Cart from "./pages/store/Cart";
import Checkout from "./pages/store/Checkout";
import ThankYou from "./pages/store/ThankYou";

// Wholesaler auth pages
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";

// Customer auth & pages for storefront
import { CustomerAuthProvider } from "./pages/auth/CustomerAuthContext";
import StorefrontProtectedRoute from "./components/StorefrontProtectedRoute";
import CustomerSignUp from "./pages/store/CustomerSignUp";
import CustomerLogin from "./pages/store/CustomerLogin";

// Contexts
import { AuthProvider } from "./pages/auth/AuthContext"; // wholesaler/admin auth
import { CartProvider } from "./context/CartContext";

// Components
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      {/* Wholesaler/Admin Authentication Context */}
      <AuthProvider>
        {/* Customer Auth + Cart Contexts wrap storefront */}
        <CustomerAuthProvider>
          <CartProvider>
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" />} />

              {/* Wholesaler Auth routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Wholesaler Admin Routes */}
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

              {/* Storefront (customer-facing) routes */}
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

              {/* Customer signup / login pages for storefront */}
              <Route path="/store/:slug/signup" element={<CustomerSignUp />} />
              <Route path="/store/:slug/login" element={<CustomerLogin />} />

              {/* Thank you page */}
              <Route path="/store/thank-you" element={<ThankYou />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
