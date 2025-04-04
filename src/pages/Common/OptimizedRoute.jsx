// src/components/OptimizedRoute.js
import React, { useState, useEffect, useCallback } from "react";
import { Button, Card, Spinner, Alert } from "react-bootstrap";
import {
  GoogleMap,
  DirectionsRenderer,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import { getAcceptedWastePosts, markWasteAsCollected } from "../../services/wasteService";
import { useAuth } from "../../context/AuthContext";
// Define the libraries constant outside the component.
const LIBRARIES = ["places"];

// Map container style.
const mapContainerStyle = {
  width: "100%",
  height: "500px",
};
 

// Helper: Compute Haversine distance (in km) between two lat/lng points.
const computeDistance = (loc1, loc2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km.
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) *
      Math.cos(toRad(loc2.lat)) *
      Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const OptimizedRoute = () => {
  // State for accepted posts (only those accepted by current volunteer/recycler)
  const [acceptedPosts, setAcceptedPosts] = useState([]);
  // For route computation we derive origin (userLocation), destination, and intermediate waypoints.
  const [userLocation, setUserLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  // State for directions and route summary.
  const [directions, setDirections] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);
  const [error, setError] = useState("");
  const [loadingRoute, setLoadingRoute] = useState(false);
  // State to hold the post currently selected (for showing InfoWindow details)
  const [selectedPost, setSelectedPost] = useState(null);
  const { userId, role } = useAuth();

  // Load the Google Maps API using the LIBRARIES constant.
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });



  // 1. Get the user's current location.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => setError("Error fetching location: " + err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  // 2. Fetch accepted posts for the current volunteer/recycler.
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await getAcceptedWastePosts();
        const currentUserId = userId;
        // Filter posts accepted by current user and that have a valid location.
        const filtered = posts.filter(
          (post) => post.acceptedBy === currentUserId && post.location
        );
        setAcceptedPosts(filtered);
      } catch (err) {
        setError("Error fetching accepted posts: " + err.message);
      }
    };
    fetchPosts();
  }, []);

  // 3. Determine destination and waypoints solely from accepted posts.
  useEffect(() => {
    if (!userLocation) return;
    if (acceptedPosts.length === 0) {
      setDestination(null);
      setWaypoints([]);
      return;
    }
    if (acceptedPosts.length === 1) {
      // With a single post, route from userLocation to that post.
      setDestination(acceptedPosts[0].location);
      setWaypoints([]);
      return;
    }
    // For multiple posts, choose the accepted post farthest from the user as destination.
    let farthest = acceptedPosts[0];
    acceptedPosts.forEach((post) => {
      if (
        computeDistance(userLocation, post.location) >
        computeDistance(userLocation, farthest.location)
      ) {
        farthest = post;
      }
    });
    setDestination(farthest.location);
    // All other accepted posts become intermediate waypoints.
    const wps = acceptedPosts
      .filter((post) => post.id !== farthest.id)
      .map((post) => post.location);
    setWaypoints(wps);
  }, [acceptedPosts, userLocation]);

  // 4. Compute route using the DirectionsService.
  const computeRoute = useCallback(() => {
    if (!userLocation || !destination || !window.google) return;
    setLoadingRoute(true);
    const directionsService = new window.google.maps.DirectionsService();
    const request = {
      origin: userLocation,
      destination: destination,
      waypoints: waypoints.map((pt) => ({
        location: pt,
        stopover: true,
      })),
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
    };
    directionsService.route(request, (result, status) => {
      setLoadingRoute(false);
      if (status === window.google.maps.DirectionsStatus.OK) {
        setDirections(result);
        let totalDistance = 0;
        let totalDuration = 0;
        result.routes[0].legs.forEach((leg) => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });
        setRouteSummary({
          distance: (totalDistance / 1000).toFixed(1) + " km",
          duration: Math.round(totalDuration / 60) + " mins",
        });
      } else {
        setError("Could not compute route: " + status);
      }
    });
  }, [userLocation, destination, waypoints]);

  useEffect(() => {
    if (isLoaded && userLocation && destination) {
      computeRoute();
    }
  }, [isLoaded, userLocation, destination, waypoints, computeRoute]);

  // 5. Handle marking a post as collected.
  const handleMarkAsCollected = async (postId) => {
    try {
      await markWasteAsCollected(postId);
      setAcceptedPosts((prev) => prev.filter((post) => post.id !== postId));
      setSelectedPost(null);
      computeRoute();
    } catch (err) {
      setError("Error marking post as collected: " + err.message);
    }
  };

  // 6. Redirect to Google Maps with full route directions.
  // This constructs a URL using the user's location as origin,
  // destination, and waypoints (if any) separated by a pipe character.
  const openFullRouteInGoogleMaps = () => {
    if (!userLocation || !destination) return;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    if (waypoints.length > 0) {
      const waypointsParam = waypoints
        .map((pt) => `${pt.lat},${pt.lng}`)
        .join("|");
      url += `&waypoints=${encodeURIComponent(waypointsParam)}`;
    }
    window.open(url, "_blank");
  };

  // Center the map on the user's location if available.
  const mapCenter = userLocation || { lat: 17.3850, lng: 78.4867 };

  if (!isLoaded) return <Spinner animation="border" className="m-4" />;
  if (error) return <Alert variant="danger" className="m-4">{error}</Alert>;
  if (acceptedPosts.length === 0)
    return <Alert variant="info" className="m-4">No accepted posts available for routing.</Alert>;

  return (
    <Card className="m-4 shadow">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Optimized Route</h4>
        <div>
          <Button variant="primary" onClick={computeRoute} className="me-2">
            {loadingRoute ? "Recalculating..." : "Recalculate Route"}
          </Button>
          <Button variant="info" onClick={openFullRouteInGoogleMaps}>
            Open in Google Maps
          </Button>
        </div>
      </Card.Header>
      {routeSummary && (
        <Card.Body>
          <p>
            <strong>Total Distance:</strong> {routeSummary.distance}
          </p>
          <p>
            <strong>Estimated Travel Time:</strong> {routeSummary.duration}
          </p>
        </Card.Body>
      )}
      <Card.Body>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={12}
          center={mapCenter}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
          }}
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {/* Marker for user's current location (blue) */}
          <Marker
            position={userLocation}
            label="You"
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
          />
          {/* Render red markers for each accepted post */}
          {acceptedPosts.map((post) => (
            <Marker
              key={post.id}
              position={post.location}
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
              onClick={() => setSelectedPost(post)}
            />
          ))}
          {/* InfoWindow: Show full post details and actions */}
          {selectedPost && (
            <InfoWindow
              position={selectedPost.location}
              onCloseClick={() => setSelectedPost(null)}
            >
              <div style={{ maxWidth: "250px" }}>
                <h5>{selectedPost.wasteType || "Waste Post"}</h5>
                <p>
                  <strong>Quantity:</strong> {selectedPost.quantity || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {selectedPost.address || "N/A"}
                </p>
                <p>
              <strong>Available Date:</strong>{" "}
              {selectedPost.availableDate
                ? (selectedPost.availableDate.toDate
                    ? selectedPost.availableDate.toDate().toLocaleDateString()
                    : new Date(selectedPost.availableDate).toLocaleDateString())
                : "N/A"}
            </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {selectedPost.availableFrom || "N/A"} -{" "}
                  {selectedPost.availableTo || "N/A"}
                </p>
                <div className="d-flex justify-content-between mt-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkAsCollected(selectedPost.id)}
                  >
                    Mark as Collected
                  </Button>
                  
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </Card.Body>
    </Card>
  );
};

export default OptimizedRoute;
