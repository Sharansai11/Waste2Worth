// src/components/MyPosts/PostForm.js
import React, { useState, useRef, useEffect } from "react";
import { Modal, Button, Form, Alert, InputGroup } from "react-bootstrap";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { geocodeLatLng } from "../../services/mapsService";
import { addWastePost, updateWastePost, uploadImage } from "../../services/wasteService";
import { useAuth } from "../../context/AuthContext";

const LIBRARIES = ["places"];
const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 28.7041, lng: 77.1025 };

const PostForm = ({ show, onHide, onPostCreated, setError, editMode = false, postToEdit = null }) => {
  const { userId, email, contact } = useAuth();

  const convertToISODateString = (dateValue) => {
    if (!dateValue) return "";
    let dateObj;
    if (dateValue.toDate) {
      dateObj = dateValue.toDate();
    } else {
      dateObj = new Date(dateValue);
    }
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    wasteType: "",
    quantity: "",
    address: "",
    availableDate: "",
    availableFrom: "",
    availableTo: "",
    sellForFree: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Helper function: Convert a File object to base64 string.
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Get current location when the form is first shown
  useEffect(() => {
    if (show && !editMode && !location) {
      getCurrentLocation();
    }
  }, [show, editMode, location]);

  // Get current location function
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser.");
      return;
    }
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = { lat: latitude, lng: longitude };
        setLocation(loc);
        try {
          const addr = await geocodeLatLng(latitude, longitude);
          setFormData((prev) => ({ ...prev, address: addr }));
        } catch (geoErr) {
          console.error("Reverse geocode error:", geoErr);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (err) => {
        console.error("Failed to get current location:", err.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    if (editMode && postToEdit) {
      setFormData({
        wasteType: postToEdit.wasteType || "",
        quantity: postToEdit.quantity || "",
        address: postToEdit.address || "",
        availableDate: convertToISODateString(postToEdit.availableDate),
        availableFrom: postToEdit.availableFrom || "",
        availableTo: postToEdit.availableTo || "",
        sellForFree: postToEdit.sellForFree || false,
      });
      setLocation(postToEdit.location || null);
    }
  }, [editMode, postToEdit]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUseCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleSelectOnMap = () => setShowMap(true);
  const handleCloseMap = () => setShowMap(false);
  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const loc = { lat, lng };
    setLocation(loc);
    try {
      const addr = await geocodeLatLng(lat, lng);
      setFormData((prev) => ({ ...prev, address: addr }));
    } catch (err) {
      console.error("Reverse geocode error:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Error accessing camera: " + err.message);
      }
    };

    if (useCamera) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useCamera, setError]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");
      setImageFile(imageData);
      if (videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setUseCamera(false);
      console.log("Photo captured, camera stream stopped.");
    }
  };

  const toggleImageSource = () => {
    setUseCamera((prev) => !prev);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("User not logged in.");
      return;
    }
    let imageUrl = null;
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (uploadErr) {
        setError("Image upload failed: " + uploadErr.message);
        return;
      }
    }

    const postObj = {
      contributorId: userId,
      contributorEmail: email, // Added contributor email here
      wasteType: formData.wasteType,
      quantity: parseFloat(formData.quantity),
      address: formData.address,
      contact: contact,
      location,
      availableDate: formData.availableDate ? new Date(formData.availableDate) : null,
      availableFrom: formData.availableFrom || null,
      availableTo: formData.availableTo || null,
      sellForFree: formData.sellForFree,
      imageUrl,
      updatedAt: new Date(),
    };

    console.log("Submitting post:", postObj);

    try {
      if (editMode && postToEdit) {
        await updateWastePost(postToEdit.id, postObj);
      } else {
        postObj.createdAt = new Date();
        postObj.status = "pending";
        postObj.acceptedBy = null;
        await addWastePost(postObj);
      }
      console.log("Post submitted successfully");
      onPostCreated();
      setFormData({
        wasteType: "",
        quantity: "",
        address: "",
        availableDate: "",
        availableFrom: "",
        availableTo: "",
        sellForFree: false,
      });
      setLocation(null);
      setImageFile(null);
      onHide();
    } catch (err) {
      setError(err.message);
      console.error("Submission error:", err);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Waste Post" : "Add New Waste Post"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Waste Type</Form.Label>
              <Form.Control
                type="text"
                name="wasteType"
                value={formData.wasteType}
                onChange={handleInputChange}
                placeholder="e.g., Plastic, Organic"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Weight (in kg)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="Enter weight in kg"
                  step="0.001"
                  min="0.01"
                  required
                />
                <InputGroup.Text>kg</InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button variant="outline-secondary" onClick={toggleImageSource}>
                {useCamera ? "Switch to Upload" : "Switch to Camera"}
              </Button>
            </div>
            {useCamera ? (
              <div className="mb-3 text-center">
                <video ref={videoRef} autoPlay style={{ width: "100%", maxHeight: "300px" }} />
                <Button variant="secondary" onClick={capturePhoto} className="mt-2">
                  Capture Photo
                </Button>
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>Upload Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!imageFile}
                  ref={uploadInputRef}
                />
              </Form.Group>
            )}
            {imageFile && (
              <div className="mt-3">
                <p>
                  <strong>Image Preview:</strong>
                </p>
                <img
                  src={typeof imageFile === "string" ? imageFile : URL.createObjectURL(imageFile)}
                  alt="Preview"
                  style={{ maxWidth: "150px", maxHeight: "150px", border: "1px solid #ddd", padding: "4px" }}
                />
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={isGettingLocation ? "Getting your location..." : "Enter pickup address"}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-between mb-3">
              <Button variant="outline-secondary" onClick={handleUseCurrentLocation} disabled={isGettingLocation}>
                {isGettingLocation ? "Getting location..." : "Use Current Location"}
              </Button>
              <Button variant="outline-primary" onClick={handleSelectOnMap}>
                Select on Map
              </Button>
            </div>
            {location && (
              <Alert variant="info">
                Selected Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Alert>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Available Date (Next 7 Days)</Form.Label>
              <Form.Control
                type="date"
                name="availableDate"
                value={formData.availableDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split("T")[0]}
                max={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  return d.toISOString().split("T")[0];
                })()}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Available From</Form.Label>
              <Form.Control
                type="time"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Available To</Form.Label>
              <Form.Control
                type="time"
                name="availableTo"
                value={formData.availableTo}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="sellForFree"
                checked={formData.sellForFree}
                onChange={handleInputChange}
                label="Sell for Free"
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              {editMode ? "Update Post" : "Submit Post"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <Modal show={showMap} onHide={handleCloseMap} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select Location on Map</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "500px" }}>
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={location || defaultCenter}
              zoom={location ? 14 : 10}
              onClick={handleMapClick}
            >
              {location && <Marker position={location} />}
            </GoogleMap>
          </LoadScript>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseMap}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PostForm;