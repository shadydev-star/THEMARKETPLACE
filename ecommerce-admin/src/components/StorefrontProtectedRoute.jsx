// src/components/StorefrontProtectedRoute.jsx
import { Navigate, useParams, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../pages/auth/CustomerAuthContext";

export default function StorefrontProtectedRoute({ children }) {
  const { customer, loading } = useCustomerAuth();
  const { slug } = useParams();
  const location = useLocation();

  // 🕓 Wait for auth to initialize before deciding anything
  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  }

  // 💾 Always store current slug for redirect consistency
  if (slug) {
    localStorage.setItem("lastStoreSlug", slug);
  }

  // 🚫 If not logged in, save intended page and go to signup
  if (!customer) {
    localStorage.setItem("redirectAfterSignup", location.pathname);
    return <Navigate to={`/store/${slug}/signup`} replace />;
  }

  // ✅ Logged in → allow access
  return children;
}
