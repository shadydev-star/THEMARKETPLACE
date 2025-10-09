import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "../../styles/customerAuth.css";

export default function CustomerLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { customerLogin } = useCustomerAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await customerLogin(form.email, form.password);
      navigate(`/store/${slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Log in to continue shopping</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="auth-input"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="auth-input"
            required
          />

          {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

          <button className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <p className="auth-link">
          Don’t have an account?{" "}
          <Link to={`/store/${slug}/signup`}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
