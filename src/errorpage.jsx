import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

const ErrorPage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center vh-100 text-center">
      <h1 className="display-3 text-danger">404</h1>
      <h2 className="mb-4">Oops! Page Not Found</h2>
      <p className="text-muted">
        The page you are looking for doesn’t exist or has been moved.
      </p>
      <Button variant="primary" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </Container>
  );
};

export default ErrorPage;
