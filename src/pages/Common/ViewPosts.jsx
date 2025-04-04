// src/components/MyPosts/ViewPosts.js
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  ButtonGroup,
  Form,
  InputGroup,
  Modal,
  Tabs,
  Tab,
  Badge
} from "react-bootstrap";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import {
  getPendingOrAcceptedPosts,
  acceptWasteRequest,
  markWasteAsCollected,
  revertToAccepted
} from "../../services/wasteService";
import { useAuth } from "../../hooks/useAuth";
import { geocodeLatLng } from "../../services/mapsService";
import { createChat, getMessages, sendMessage, markMessagesAsRead } from "../../services/chatService";
import { ChatDots, GeoAlt, CheckCircle, XCircle } from "react-bootstrap-icons";
import ChatModal from "../Common/ChatModal";
import ChatsTab from "../Common/ChatsTab";

// Helper: Compute Haversine distance (in km) between two lat/lng points.
const computeDistance = (loc1, loc2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const LIBRARIES = ["places"];
const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 28.7041, lng: 77.1025 };

const ViewPosts = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Default filter is set to "pending"
  const [filter, setFilter] = useState("pending");
  // States for searching nearby posts.
  const [searchLocation, setSearchLocation] = useState(null); // e.g., { lat, lng }
  const [searchRadius, setSearchRadius] = useState(10); // default 10 km
  // State for showing the map to select a search location.
  const [showSearchMap, setShowSearchMap] = useState(false);
  // State for holding a human-readable address for the search location.
  const [searchAddress, setSearchAddress] = useState("");

  // States for OTP verification.
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  
  // States for chat functionality
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, filter, searchLocation, searchRadius]);

  // Update searchAddress whenever searchLocation changes.
  useEffect(() => {
    if (searchLocation) {
      geocodeLatLng(searchLocation.lat, searchLocation.lng)
        .then((address) => setSearchAddress(address))
        .catch((err) => {
          console.error("Reverse geocode error:", err);
          setSearchAddress(`${searchLocation.lat.toFixed(4)}, ${searchLocation.lng.toFixed(4)}`);
        });
    } else {
      setSearchAddress("");
    }
  }, [searchLocation]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getPendingOrAcceptedPosts();
      setPosts(data);
    } catch (err) {
      setError("Failed to fetch posts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if a post is within the search radius.
  const isPostNearby = (post) => {
    if (!searchLocation || !post.location) return true;
    return computeDistance(searchLocation, post.location) <= searchRadius;
  };

  /**
   * Filter posts based on:
   * - Selected filter (pending, accepted, collected)
   * - Proximity (if searchLocation is set)
   */
  const filterPosts = () => {
    let baseFiltered = [];
    if (filter === "pending") {
      baseFiltered = posts.filter((post) => post.status === "pending");
    } else if (filter === "accepted") {
      baseFiltered = posts.filter(
        (post) => post.status === "accepted" && post.acceptedBy === user.uid
      );
    } else if (filter === "collected") {
      baseFiltered = posts.filter(
        (post) => post.status === "collected" && post.acceptedBy === user.uid
      );
    } else {
      baseFiltered = posts;
    }
    setFilteredPosts(baseFiltered.filter(isPostNearby));
  };

  /**
   * Toggle acceptance of a post.
   * If a post is pending, accept it. If it's already accepted by the current user, revert to pending.
   */
  const handleAcceptToggle = async (postId, currentStatus, acceptedBy) => {
    try {
      if (currentStatus === "pending") {
        await acceptWasteRequest(postId, user.uid, "accepted");
        updateLocalStatus(postId, "accepted", user.uid);
      } else if (currentStatus === "accepted" && acceptedBy === user.uid) {
        await acceptWasteRequest(postId, user.uid, "pending");
        updateLocalStatus(postId, "pending", null);
      }
    } catch (err) {
      setError("Error updating post: " + err.message);
    }
  };

  /**
   * Before marking as collected, ask for OTP confirmation.
   * The OTP is sent to the contributor's email.
   */
  const handleCollectedToggle = async (postId, currentStatus, acceptedBy, contributorEmail) => {
    try {
      if (currentStatus === "accepted" && acceptedBy === user.uid) {
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        setSelectedPost(postId);
  
        // Send OTP to contributor's email
        const OTP_URL = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${OTP_URL}/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: contributorEmail, otp: otp }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to send OTP");
        }
  
        // Open OTP modal for volunteer to enter the code
        setShowOTPModal(true);
      } else if (currentStatus === "collected" && acceptedBy === user.uid) {
        // Revert back to accepted
        await revertToAccepted(postId, acceptedBy);
        updateLocalStatus(postId, "accepted", acceptedBy);
      }
    } catch (err) {
      setError("Error marking post as collected: " + err.message);
    }
  };
  
  // Function to verify OTP entered by volunteer
  const verifyOTPAndMarkCollected = async () => {
    if (otpInput === generatedOTP) {
      try {
        await markWasteAsCollected(selectedPost);
        updateLocalStatus(selectedPost, "collected", user.uid);
        setShowOTPModal(false);
        setOtpInput("");
      } catch (err) {
        setError("Error marking post as collected: " + err.message);
      }
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  const updateLocalStatus = (postId, newStatus, newAcceptedBy) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, status: newStatus, acceptedBy: newAcceptedBy } : post
      )
    );
  };

  // Set searchLocation to the current user's location.
  const handleSetSearchLocationToCurrent = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => setError("Error fetching current location: " + err.message)
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Open the modal to select location from the map.
  const handleOpenSearchMap = () => {
    setShowSearchMap(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => setError("Error fetching current location: " + err.message)
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Close the search map modal.
  const handleCloseSearchMap = () => {
    setShowSearchMap(false);
  };

  // When the map is clicked, update searchLocation and close the modal.
  const handleSearchMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSearchLocation({ lat, lng });
    setShowSearchMap(false);
  };
  
  // Handle chat initiation
  const handleChatClick = async (post) => {
    try {
      // Create or get existing chat between collector and contributor
      const newChatId = await createChat(post.id, post.contributorId, user.uid);
      setChatId(newChatId);
      setSelectedPost(post);
      setShowChatModal(true);
    } catch (error) {
      console.error("Error initiating chat:", error);
      setError("Failed to open chat. Please try again.");
    }
  };

  if (loading && activeTab === "posts") return <Spinner animation="border" className="m-4" />;

  return (
    <Container className="mt-4">
      <h4>Waste Management</h4>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="posts" title={<strong>Available Posts</strong>}>
          {/* Filter Buttons */}
          <ButtonGroup className="mb-3">
            <Button
              variant={filter === "pending" ? "success" : "outline-primary"}
              onClick={() => setFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "accepted" ? "success" : "outline-primary"}
              onClick={() => setFilter("accepted")}
            >
              Accepted
            </Button>
            <Button
              variant={filter === "collected" ? "success" : "outline-primary"}
              onClick={() => setFilter("collected")}
            >
              Collected
            </Button>
          </ButtonGroup>

          {/* Search Nearby Section */}
          <Card className="mb-3">
            <Card.Body>
              <h5>Search Nearby</h5>
              <InputGroup className="mb-2">
                <Form.Control
                  placeholder="Enter search radius (km)"
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(e.target.value)}
                />
                <Button
                  variant="outline-dark"
                  onClick={handleSetSearchLocationToCurrent}
                >
                  Use My Location
                </Button>
                <Button variant="outline-dark" onClick={handleOpenSearchMap}>
                  Select from Map
                </Button>
              </InputGroup>
              {searchLocation && (
                <Alert variant="info" className="mt-2">
                  Searching posts within {searchRadius || "an unspecified"} km of {searchAddress}
                </Alert>
              )}
            </Card.Body>
          </Card>

          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

          <Row>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Col md={4} key={post.id} className="mb-3">
               <Card className="h-100 border border-3 border-dark border-opacity-25 text-center shadow-sm rounded-4">
                    {post.imageUrl && (
                      <Card.Img 
                        variant="top" 
                        src={post.imageUrl} 
                        style={{ height: "150px", objectFit: "cover" }} 
                      />
                    )}
                    <Card.Body className="d-flex flex-column  ">
                      <Card.Title className="d-flex justify-content-between align-items-center">
                        {post.wasteType || "Untitled Waste"}
                        <Badge bg={post.status === "pending" ? "warning" : post.status === "accepted" ? "primary" : "success"}>
                          {post.status}
                        </Badge>
                      </Card.Title>
                      <Card.Text>
                        <strong>Quantity:</strong> {post.quantity} kg <br />
                        {post.address && (
                          <>
                            <strong>Address:</strong> {post.address} <br />
                          </>
                        )}
                        {/* Display contact info only for accepted posts */}
                        {post.status === "accepted" && post.contact && (
                          <>
                            <strong>Contact:</strong> {post.contact} <br />
                          </>
                        )}
                        {post.availableDate && (
                          <>
                            <strong>Scheduled Date:</strong>{" "}
                            {post.availableDate.toDate
                              ? post.availableDate.toDate().toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : new Date(post.availableDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            <br />
                            <strong>Available:</strong> {post.availableFrom} - {post.availableTo} <br />
                          </>
                        )}
                        {post.sellForFree && (
                          <Badge bg="success" className="me-2">Free</Badge>
                        )}
                      </Card.Text>

                      <div className="mt-auto">
                        {/* Chat button - show only for accepted posts */}
                        {post.status === "accepted" && post.acceptedBy === user.uid && (
  <Button
    variant="outline-primary"
    className="me-2 mb-2"
    onClick={() => handleChatClick(post)}
    style={{
      backgroundColor: 'var(--bs-primary)',
      color: 'white',
      borderColor: 'var(--bs-primary)',
    }}
  >
    <ChatDots className="me-1" /> Chat with Contributor
  </Button>
)}


{post.location?.lat && post.location?.lng && (
  <Button
    variant="outline-info"
    href={`https://www.google.com/maps/dir/?api=1&destination=${post.location.lat},${post.location.lng}`}
    target="_blank"
    className="me-2 mb-2 text-dark"
    style={{
      backgroundColor: 'var(--bs-info)', // fills the background like `info`
      color: 'white', // makes text readable
      borderColor: 'var(--bs-info)', // matches border to background
    }}
  >
    <GeoAlt className="me-1" />Get Directions
  </Button>
)}

                        {/* Accept/Cancel/Collected Toggle Buttons */}
                        {post.status === "pending" && (
                          <Button
                            variant="primary"
                            onClick={() =>
                              handleAcceptToggle(post.id, post.status, post.acceptedBy)
                            }

                            style={{marginTop:'-5px'}}
                          >
                            <CheckCircle className="me-1" /> Accept
                          </Button>
                        )}
                        {post.status === "accepted" && post.acceptedBy === user.uid && (
                          <>
                            <Button
                              variant="warning"
                              onClick={() =>
                                handleAcceptToggle(post.id, post.status, post.acceptedBy)
                              }
                              className="me-2"
                            >
                              <XCircle className="me-1" /> Cancel
                            </Button>
                            <Button
                              variant="success"
                              onClick={() =>
                                handleCollectedToggle(
                                  post.id,
                                  post.status,
                                  post.acceptedBy,
                                  post.contributorEmail
                                )
                              }
                            >
                              Mark as Collected
                            </Button>
                          </>
                        )}
                        {post.status === "collected" && post.acceptedBy === user.uid && (
                          <>
                            <p
  className=" mt-2"
  style={{
    backgroundColor: 'var(--bs-success)',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
  }}
>
  <CheckCircle className="me-1" /> Collected
</p>

<Button
  variant="outline-danger"
  onClick={() =>
    handleCollectedToggle(post.id, post.status, post.acceptedBy)
  }
  style={{
    backgroundColor: 'var(--bs-danger)',
    color: 'white',
    marginLeft: '5px',
    marginTop: "-5px",
    borderColor: 'var(--bs-danger)',
  }}
>
  Undo Collected
</Button>

                          </>
                        )}
                        {post.status === "accepted" && post.acceptedBy !== user.uid && (
                          <p className="text-muted mt-2">Accepted by another user</p>
                        )}
                        {post.status === "collected" && post.acceptedBy !== user.uid && (
                          <p className="text-success mt-2">Collected by another user</p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col>
                <Alert variant="info">
                  No posts found. {filter !== "pending" ? "Try changing your filter or search criteria." : "Check back later for new waste posts."}
                </Alert>
              </Col>
            )}
          </Row>
        </Tab>
        
        <Tab eventKey="conversations" title={<strong>My Conversations</strong>}>
          <ChatsTab />
        </Tab>
      </Tabs>

      {/* OTP Modal */}
      <Modal show={showOTPModal} onHide={() => { setShowOTPModal(false); setOtpInput(""); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Enter OTP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Please enter the OTP sent to the contributor's email</Form.Label>
            <Form.Control
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter OTP"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowOTPModal(false); setOtpInput(""); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={verifyOTPAndMarkCollected}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for selecting search location from map */}
      <Modal show={showSearchMap} onHide={handleCloseSearchMap} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Search Location</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "400px" }}>
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={LIBRARIES}
          >
            <GoogleMap
              key={searchLocation ? JSON.stringify(searchLocation) : "default"}
              mapContainerStyle={mapContainerStyle}
              center={searchLocation || defaultCenter}
              zoom={searchLocation ? 14 : 10}
              onClick={handleSearchMapClick}
            >
              {searchLocation && <Marker position={searchLocation} />}
            </GoogleMap>
          </LoadScript>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseSearchMap}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Chat Modal */}
      {selectedPost && showChatModal && (
        <ChatModal
          show={showChatModal}
          onHide={() => setShowChatModal(false)}
          chatId={chatId}
          postId={selectedPost.id}
          otherUserId={selectedPost.contributorId}
        />
      )}
    </Container>
  );
};

export default ViewPosts;