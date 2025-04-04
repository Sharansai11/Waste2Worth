import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../src/firebaseConfig"; // Adjust path as needed

// We define libraries outside the component to avoid performance warnings
const LIBRARIES = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

function NearbyRecyclers() {
  const [userLocation, setUserLocation] = useState(null);
  const [firestoreRecyclers, setFirestoreRecyclers] = useState([]);
  const [publicPlaces, setPublicPlaces] = useState([]); // from nearbySearch
  const [error, setError] = useState("");
  const [mapRef, setMapRef] = useState(null);

  // For the InfoWindow
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Load the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
      },
      (err) => setError("Error fetching location: " + err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  // Only fetch public places when both map is loaded and user location is available
  useEffect(() => {
    if (isLoaded && userLocation && window.google) {
      fetchPublicPlaces(userLocation);
    }
  }, [isLoaded, userLocation]);

  useEffect(() => {
    const fetchFirestoreRecyclers = async () => {
      try {
        const recyclerRef = collection(db, "recyclers");
        const snapshot = await getDocs(recyclerRef);
        const recyclerList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Filter out any docs missing lat/lng
        setFirestoreRecyclers(recyclerList.filter((r) => r.lat && r.lng));
      } catch (err) {
        setError("Error fetching recyclers from Firestore: " + err.message);
      }
    };
    fetchFirestoreRecyclers();
  }, []);

  // Store map reference when the map is loaded
  const onMapLoad = (map) => {
    setMapRef(map);
  };

  // 1) Use nearbySearch to find scrap shops
  const fetchPublicPlaces = (location) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.log("Google Maps Places API not fully loaded yet, will retry.");
      // We'll rely on the useEffect to try again when everything is loaded
      return;
    }
    
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      
      const request = {
        location,
        radius: 5000,
        keyword: "scrap shop",
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          // Store minimal info now, we fetch details on marker click
          const places = results.map((p) => ({
            placeId: p.place_id,
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng(),
          }));
          setPublicPlaces(places);
        } else {
          console.log("Google Places search status:", status);
          setError("Google Places search failed: " + status);
        }
      });
    } catch (err) {
      console.error("Error in fetchPublicPlaces:", err);
      setError("Error in Places search: " + err.message);
    }
  };

  // 2) On marker click, get place details
  const handlePublicMarkerClick = (place) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      setError("Google Maps Places API not fully loaded.");
      return;
    }
    
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
      
      const request = {
        placeId: place.placeId,
        fields: ["name", "formatted_address", "photos", "rating", "international_phone_number"],
      };

      service.getDetails(request, (details, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
          // Build an object with the relevant info
          const photoUrl = details.photos && details.photos.length > 0
            ? details.photos[0].getUrl({ maxWidth: 300, maxHeight: 300 })
            : null;

          setSelectedMarker({
            lat: place.lat,
            lng: place.lng,
            name: details.name,
            address: details.formatted_address,
            phone: details.international_phone_number || "",
            rating: details.rating || null,
            photoUrl,
          });
        } else {
          // fallback if we can't fetch details
          setSelectedMarker({
            lat: place.lat,
            lng: place.lng,
            name: "Unknown Place",
          });
        }
      });
    } catch (err) {
      console.error("Error getting place details:", err);
      setSelectedMarker({
        lat: place.lat,
        lng: place.lng,
        name: "Place details unavailable",
      });
    }
  };

  // 3) InfoWindow close
  const handleCloseInfo = () => {
    setSelectedMarker(null);
  };

  // 4) Build a directions link
  const getDirectionsLink = (lat, lng) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  // 5) Markers for Firestore recyclers
  const handleFirestoreMarkerClick = (r) => {
    // If you want more details, store them in Firestore
    setSelectedMarker({
      lat: r.lat,
      lng: r.lng,
      name: r.name,
      address: r.address || "",
      phone: r.phone || "",
    });
  };

  if (loadError) return <p>Error loading maps: {loadError.message}</p>;
  if (!isLoaded) return <p>Loading map library...</p>;
  if (!userLocation) return <p>Loading your location...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h4>Nearby Recyclers</h4>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={userLocation}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          styles: [
            { featureType: "poi.business", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* 1) User location marker */}
        <Marker position={userLocation} label="You" />

        {/* 2) Registered Recyclers from Firestore (blue marker) */}
        {firestoreRecyclers.map((r) => (
          <Marker
            key={r.id}
            position={{ lat: r.lat, lng: r.lng }}
            label={r.name || "Recycler"}
            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            onClick={() => handleFirestoreMarkerClick(r)}
          />
        ))}

        {/* 3) Public scrap shops (red marker) */}
        {publicPlaces.map((place) => (
          <Marker
            key={place.placeId}
            position={{ lat: place.lat, lng: place.lng }}
            icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
            onClick={() => handlePublicMarkerClick(place)}
          />
        ))}

        {/* 4) InfoWindow if marker is selected */}
        {selectedMarker && (
         <InfoWindow
           position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
           onCloseClick={handleCloseInfo}
         >
           <div style={{ width: "220px", maxHeight: "300px", overflowY: "auto" }}>
             {selectedMarker.photoUrl && (
               <img
                 src={selectedMarker.photoUrl}
                 alt={selectedMarker.name}
                 style={{ width: "100%", marginBottom: "0.5rem" }}
               />
             )}
             <h5 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
               {selectedMarker.name}
             </h5>
             {selectedMarker.address && (
               <p style={{ margin: 0 }}>
                 <strong>Address:</strong> {selectedMarker.address}
               </p>
             )}
             {selectedMarker.phone && (
               <p style={{ margin: 0 }}>
                 <strong>Phone:</strong> {selectedMarker.phone}
               </p>
             )}
             {selectedMarker.rating && (
               <p style={{ margin: 0 }}>
                 <strong>Rating:</strong> {selectedMarker.rating} / 5
               </p>
             )}
             <a
               href={getDirectionsLink(selectedMarker.lat, selectedMarker.lng)}
               target="_blank"
               rel="noopener noreferrer"
             >
               <button
                 style={{
                   marginTop: "8px",
                   padding: "8px 12px",
                   backgroundColor: "#007BFF",
                   color: "#fff",
                   border: "none",
                   borderRadius: "4px",
                   cursor: "pointer",
                 }}
               >
                 Get Directions
               </button>
             </a>
           </div>
         </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default NearbyRecyclers;