import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import 'bootstrap/dist/css/bootstrap.min.css';

import Storefront from "./pages/store/Storefront";
import Cart from "./pages/store/Cart";
import Checkout from "./pages/store/Checkout";
import ThankYou from "./pages/store/ThankYou";

import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";

import { AuthProvider } from "./pages/auth/AuthContext";

import { CartProvider } from "./context/CartContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Auth routes */}
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

            {/* Public Storefront Routes */}
            <Route path="/store/:slug" element={<Storefront />} />
            <Route path="/store/:slug/cart" element={<Cart />} />
            <Route path="/store/:slug/checkout" element={<Checkout />} />
            <Route path="/store/thank-you" element={<ThankYou />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
