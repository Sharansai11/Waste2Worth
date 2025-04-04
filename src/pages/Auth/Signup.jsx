// src/components/MyPosts/Signup.js
import React, { useState } from "react";
import { registerUser } from "../../services/authService";
import { geocodeLatLng } from "../../services/mapsService";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Card, Alert, Modal } from "react-bootstrap";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useAuth } from "../../context/AuthContext";
import "./Signup.css"
const Signup = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("contributor");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [volunteerType, setVolunteerType] = useState("individual"); // Individual or NGO
  const [ngoName, setNgoName] = useState("");
  const { register } = useAuth(); 
  const navigate = useNavigate();

  // For Map Modal
  const [showMap, setShowMap] = useState(false);
  const mapContainerStyle = { width: "100%", height: "400px" };
  const defaultCenter = { lat: 28.7041, lng: 77.1025 };

  // Handler to open the map modal immediately and then update the center using current location
  const handleOpenMap = () => {
    setShowMap(true); // Open modal immediately
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setError("Error fetching current location: " + err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      let extraData = {};

      if (role === "contributor") {
        extraData.contact = contact; // Ensure contact is added for contributors
      }

      if (role === "volunteer" || role === "recycler" || role === "ngo") {
        extraData = {
          address,
          contact,
          location,
          ...(role === "volunteer" && { volunteerType, ngoName: volunteerType === "ngo" ? ngoName : null }),
        };
      }

      await register(email, password, role, fullName, extraData);
      navigate(`/${role}/dashboard`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const addr = await geocodeLatLng(latitude, longitude);
          setAddress(addr);
        } catch (geoErr) {
          console.error("Reverse geocode error:", geoErr);
        }
      },
      (err) => setError("Failed to get current location: " + err.message)
    );
  };

  return (
    <Container className="signup-container">
      <Card style={{ width: "400px" }} className="signup-card">
        <h3 className="signup-title ">Sign Up</h3>
        {error && <Alert variant="danger signup-error">{error}</Alert>}
        <Form onSubmit={handleSignup} className="signup-form">
          {/* Full Name or NGO Name */}
          <Form.Group className="mb-3  form-group">
            <Form.Label>{role === "ngo" ? "NGO Name" : "Full Name"}</Form.Label>
            <Form.Control
              type="text"
              placeholder={role === "ngo" ? "Enter NGO Name" : "e.g., John Doe"}
              value={fullName} className="custom-input"
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-3 form-group">
            <Form.Label>Email</Form.Label>
            <Form.Control 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required className="custom-input"
            />
          </Form.Group>

          {/* Password */}
          <Form.Group className="mb-3 form-group">
            <Form.Label>Password</Form.Label>
            <Form.Control 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required   className="custom-input"
            />
          </Form.Group>

          {/* Confirm Password */}
          <Form.Group className="mb-3 form-group">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required  className="custom-input"
            />
          </Form.Group>

          {/* Role Selection */}
          <Form.Group className="mb-3 form-group">
            <Form.Label>Select Role</Form.Label>
            <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="contributor">Contributor</option>
              <option value="volunteer">Volunteer</option>
              <option value="recycler">Recycler</option>
              <option value="ngo">NGO</option>
            </Form.Select>
          </Form.Group>

          {/* Contact for Contributor */}
          {role === "contributor" && (
            <Form.Group className="mb-3 form-group">
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter contact number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required  className="custom-input"
              />
            </Form.Group>
          )}

          {/* Address & Contact for Volunteer, Recycler & NGO */}
          {(role === "volunteer" || role === "recycler" || role === "ngo") && (
            <>
              <Form.Group className="mb-3 form-group">
                <Form.Label>Contact Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter contact number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required  className="custom-input"
                />
              </Form.Group>

              <Form.Group className="mb-3 form-group">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter or pick address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required  className="custom-input"
                />
              </Form.Group>
              
              {/* Buttons for location picking */}
              <div className="d-flex justify-content-between mb-3">
                <Button variant="outline-secondary" onClick={handleUseCurrentLocation}>
                  Use Current Location
                </Button>
                <Button variant="outline-primary" onClick={handleOpenMap}>
                  Select on Map
                </Button>
              </div>

              {/* Map Modal */}
              <Modal show={showMap} onHide={() => setShowMap(false)} size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Select Location on Map</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ height: "500px" }}>
                  <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      key={location ? JSON.stringify(location) : "default"}
                      mapContainerStyle={mapContainerStyle}
                      center={location || defaultCenter}
                      zoom={location ? 14 : 10}
                      onClick={(e) => {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setLocation({ lat, lng });
                        geocodeLatLng(lat, lng).then(setAddress);
                      }}
                    >
                      {location && <Marker position={location} />}
                    </GoogleMap>
                  </LoadScript>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowMap(false)}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}

          {/* Additional Fields for Volunteer */}
          {role === "volunteer" && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Volunteer Type</Form.Label>
                <Form.Select value={volunteerType} onChange={(e) => setVolunteerType(e.target.value)}>
                  <option value="individual">Individual</option>
                  <option value="ngo">NGO</option>
                </Form.Select>
              </Form.Group>

              {volunteerType === "ngo" && (
                <Form.Group className="mb-3">
                  <Form.Label>NGO Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter NGO name"
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    required  className="custom-input"
                  />
                </Form.Group>
              )}
            </>
          )}

          <Button variant="primary" type="submit" className="w-100 signup-button">
            Sign Up
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default Signup;
