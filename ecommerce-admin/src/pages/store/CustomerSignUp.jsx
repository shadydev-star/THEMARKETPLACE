import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "../../styles/customerAuth.css";

export default function CustomerSignUp() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { customerSignup } = useCustomerAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await customerSignup(form.name, form.email, form.password, slug);
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
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Sign up to explore {slug}’s products</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="auth-input"
            required
          />
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
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{" "}
          <Link to={`/store/${slug}/login`}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
