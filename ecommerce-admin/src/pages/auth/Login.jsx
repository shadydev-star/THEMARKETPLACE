import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import "../../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");

  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) throw new Error("Please fill in all fields");

      const slug = await login(email, password);
      navigate(`/admin/${slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordMessage("");
    setError("");

    if (!forgotPasswordEmail) {
      setError("Please enter your email address");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const message = await resetPassword(forgotPasswordEmail);
      setForgotPasswordMessage(message);
      setForgotPasswordEmail("");
      
      // Auto-close after success
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordMessage("");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
    setForgotPasswordMessage("");
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Wholesaler Login</h2>
          <p className="subtext">Access your admin dashboard</p>
        </div>

        {error && <div className="alert error">{error}</div>}
        {forgotPasswordMessage && <div className="alert success">{forgotPasswordMessage}</div>}

        {!showForgotPassword ? (
          // Login Form
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="forgot-password-link">
              <button
                type="button"
                className="text-button"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot your password?
              </button>
            </div>

            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        ) : (
          // Forgot Password Form
          <div className="forgot-password-section">
            <div className="forgot-password-header">
              <h3>Reset Password</h3>
              <p>Enter your email to receive a password reset link</p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="forgot-password-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={closeForgotPassword}
                  disabled={forgotPasswordLoading}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={forgotPasswordLoading}
                >
                  {forgotPasswordLoading ? (
                    <>
                      <div className="spinner"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>

            <div className="forgot-password-info">
              <p>📧 You'll receive an email with instructions to reset your password.</p>
              <p>🔒 Check your spam folder if you don't see it in your inbox.</p>
            </div>
          </div>
        )}

        {!showForgotPassword && (
          <div className="signup-text">
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </div>
        )}
      </div>
    </div>
  );
}