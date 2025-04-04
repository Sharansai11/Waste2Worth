import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Alert, ListGroup } from "react-bootstrap";
import { resetPassword } from "../../services/authService";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { user, role } = await login(email, password);
      console.log("Logged in user:", user);
      console.log("User role:", role);

      const roleRoutes = {
        contributor: "/contributor/dashboard",
        volunteer: "/volunteer/dashboard",
        recycler: "/recycler/dashboard",
        ngo: "/ngo/dashboard",
      };

      if (!role) {
        setError("Invalid Credentials");
        return;
      }

      navigate(roleRoutes[role] || "/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email to reset the password.");
      return;
    }
    try {
      await resetPassword(email);
      setMessage("Password reset email sent! Check your inbox.");
      setError("");
    } catch (err) {
      setError("Failed to send password reset email.");
    }
  };

  // Predefined credentials for quick access
  const presetCredentials = [
    { role: "Contributor", email: "sharansai012@gmail.com", password: "sharansai@012" },
    { role: "Volunteer", email: "volunteer@gmail.com", password: "volunteer@123" },
    { role: "Recycler", email: "recycler@gmail.com", password: "recycler@123" },
    { role: "NGO", email: "ngo@gmail.com", password: "ngo@123" }
  ];

  const handleQuickLogin = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h3 className="text-center login-heading">Welcome Back</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="custom-input"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="custom-input"
              required
            />
          </Form.Group>

          <Button type="submit" className="login-btn w-100">
            Login
          </Button>
        </Form>

        <div className="text-center mt-3">
          <Button variant="link" className="forgot-btn" onClick={handleForgotPassword}>
            Forgot Password?
          </Button>
        </div>

        {/* Credentials Section */}
        <Card.Footer className="bg-light mt-3">
          <h5 className="text-center mb-3">Demo Credentials(click  to autofill)</h5>
          <ListGroup>
            {presetCredentials.map((cred, index) => (
              <ListGroup.Item 
                key={index} 
                action 
                onClick={() => handleQuickLogin(cred)}
                className="d-flex justify-content-between align-items-center"
              >
                <span className="fw-bold">{cred.role}</span>
                <small className="text-muted">{cred.email}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <p className="text-center text-muted mt-2 small">
            <em> <b>Click on a role to autofill credentials</b></em>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default Login;