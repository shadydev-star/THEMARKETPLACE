import { Navigate, useParams } from "react-router-dom";
import { useCustomerAuth } from "../pages/auth/CustomerAuthContext";

export default function StorefrontProtectedRoute({ children }) {
  const { customer } = useCustomerAuth();
  const { slug } = useParams();

  if (!customer) return <Navigate to={`/store/${slug}/signup`} replace />;
  return children;
}
