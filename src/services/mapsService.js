// src/services/mapsService.js

/**
 * getOptimizedRoute
 * @param {Array} locations - An array of objects with lat, lng, e.g. [{ lat: 12.34, lng: 56.78 }, ...]
 * @returns {Object} - Directions result (JSON from the Google Maps Directions API)
 */

export const geocodeAddress = async (address) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } else {
    throw new Error("No geocode results found");
  }
};

// src/services/mapsService.js
export const geocodeLatLng = async (lat, lng) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].formatted_address;
  } else {
    throw new Error("No reverse geocode results found");
  }
};

export const getOptimizedRoute = async (locations) => {
  if (!locations || locations.length < 2) {
    throw new Error("At least two locations are required to build a route.");
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // The first location is the start, the last location is the end
  // Everything in between are 'waypoints' we want to optimize
  const origin = `${locations[0].lat},${locations[0].lng}`;
  const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;
  
  // Waypoints are the intermediate locations, excluding first and last
  const waypoints = locations.slice(1, -1);

  // Build the waypoints param
  // We'll set optimize:true so Google can reorder them for an optimal route
  let waypointsParam = "";
  if (waypoints.length > 0) {
    waypointsParam = waypoints
      .map(loc => `${loc.lat},${loc.lng}`)
      .join("|");
  }

  // Example request to the Directions API:
  // https://maps.googleapis.com/maps/api/directions/json?origin=...&destination=...&waypoints=optimize:true|...&key=API_KEY
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  if (waypointsParam) {
    url.searchParams.set("waypoints", `optimize:true|${waypointsParam}`);
  }
  url.searchParams.set("key", apiKey);

  // Optionally set travelMode=driving, or add &travelMode=driving if you want:
  // url.searchParams.set("mode", "driving");

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Directions API error: ${data.status}`);
  }

  return data;
};


export const fetchYouTubeSearch = async (query) => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) throw new Error("Missing  API key");

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&type=video&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("YouTube Search  request failed");
    }
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return [];
    }
    return data.items.map((item) => {
      const videoId = item.id.videoId;
      const snippet = item.snippet || {};
      return {
        videoId,
        title: snippet.title || "No title",
        thumbnailUrl:
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
      };
    });
  } catch (error) {
    console.error("YouTube Search error:", error);
    return [];
  }
};