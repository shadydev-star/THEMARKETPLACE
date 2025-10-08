// src/pages/auth/SignUp.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Container, Alert } from "react-bootstrap";
import { useAuth } from "./AuthContext";

export default function SignUp() {
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!storeName || !email || !password) throw new Error("All fields are required");

      const slug = await signup(storeName, email, password);
      navigate(`/admin/${slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <Card style={{ maxWidth: "400px", width: "100%" }} className="p-4 shadow">
        <h2 className="text-center mb-3">Create Your Wholesaler Account</h2>
        <p className="text-center text-muted mb-4">Start selling from your own storefront</p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSignup}>
          <Form.Group className="mb-3" controlId="formStoreName">
            <Form.Label>Store Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Emma’s Fashion"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button type="submit" className="w-100" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </Form>

        <div className="text-center mt-3">
          Already have an account?{" "}
          <span className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>
            Login
          </span>
        </div>
      </Card>
    </Container>
  );
}
