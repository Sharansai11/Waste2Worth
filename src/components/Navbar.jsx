import React, { useEffect } from "react";
import { Container, Nav, Navbar as BsNavbar, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { logoutUser } from "../services/authService";
import "./Navbar.css"

const Navbar = () => {
  const { user, role, setUser, setRole, setNgoName } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      // Clear the authentication context
      setUser(null);
      setRole(null);
      setNgoName(null);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    // Inject CSS to hide Google Translate's banner
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { 
        display: none !important; 
      }
      body {
        top: 0px !important;
        position: static !important;
      }
    `;
    document.head.appendChild(style);

    // Additionally, run a function periodically to hide the banner if it re-appears
    const hideBanner = () => {
      const banner = document.querySelector(".goog-te-banner-frame.skiptranslate");
      if (banner) {
        banner.style.display = "none";
      }
      document.body.style.top = "0px";
    };
    hideBanner();
    const intervalId = setInterval(hideBanner, 500);

    // Clean up when component unmounts
    return () => {
      clearInterval(intervalId);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // Load Google Translate script dynamically
  useEffect(() => {
    const addScript = document.createElement("script");
    addScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    addScript.async = true;
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <BsNavbar expand="lg" className="bg-primary py-1 shadow-sm">
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="fw-bold text-white">
          ♻ Waste2Worth
        </BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto d-flex align-items-center gap-3">
            {/* Google Translate Dropdown remains visible in the navbar */}
            <div id="google_translate_element" className="p-1 bg-light rounded"></div>
            {!user ? (
              <>
                <Nav.Link as={Link} to="/login" className="text-white fw-semibold">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/signup" className="text-white fw-semibold">
                  Sign Up
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to={`/${role}/dashboard`} className="text-white fw-semibold">
                  Dashboard
                </Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;