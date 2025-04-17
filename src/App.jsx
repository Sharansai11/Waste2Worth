import React from "react";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ErrorPage from "./errorpage";
import Home from "./home";

// Auth Pages
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
//ngo pages

import NgoDashboard from "./pages/ngo/NgoDashboard";
import ManageVol from "./pages/ngo/ManageVol";
import Bulk from "./pages/ngo/BulkUpload";
// Contributor Pages
import ConDashboard from "./pages/Contributor/ConDashboard";
import AIWasteDetection from "./pages/Contributor/AIWasteDetection";
import MyPosts from "./pages/Contributor/MyPosts";
import NearbyRecyclers from "./pages/Common/NearbyRecyclers";
// Volunteer Pages
import VolDashboard from "./pages/Volunteer/VolDashboard";
import ViewPosts from "./pages/Common/ViewPosts";
import OptimizedRoute from "./pages/Common/OptimizedRoute";

// Recycler Pages
import RecDashboard from "./pages/Recycler/RecDashboard";

// Import LoadScript from @react-google-maps/api
import { LoadScript } from "@react-google-maps/api";

const LIBRARIES = ["places"];

// Protected Route Wrapper
const ProtectedRoute = ({ element }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? element : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="d-flex">
          <Sidebar />
          <div className="flex-grow-1 p-4">
          
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              libraries={LIBRARIES}
            >
              <Routes>
                {/* Auth Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Contributor Routes */}
                <Route path="/contributor/dashboard" element={<ProtectedRoute element={<ConDashboard />} />} />
                <Route path="/contributor/ai-detection" element={<ProtectedRoute element={<AIWasteDetection />} />} />
                <Route path="/contributor/my-posts" element={<ProtectedRoute element={<MyPosts />} />} />

                {/* Common Routes */}
                <Route path="/common/nearby-recyclers" element={<ProtectedRoute element={<NearbyRecyclers />} />} />

                {/* Volunteer Routes */}
                <Route path="/volunteer/dashboard" element={<ProtectedRoute element={<VolDashboard />} />} />
            
                {/*ngo routes */}
                <Route path="/ngo/dashboard" element={<ProtectedRoute element={<NgoDashboard />} />} />
                <Route path="/ngo/volunteers" element={<ProtectedRoute element={<ManageVol />} />} />
                <Route path="/ngo/bulk-upload" element={<ProtectedRoute element={<Bulk/>} />} />
                {/* Common Routes for Volunteers and Recyclers */}
                <Route path="/view-posts" element={<ProtectedRoute element={<ViewPosts />} />} />
                <Route path="/optimized-route" element={<ProtectedRoute element={<OptimizedRoute />} />} />

                {/* Recycler Routes */}
                <Route path="/recycler/dashboard" element={<ProtectedRoute element={<RecDashboard />} />} />

                {/* Default Route */}
                <Route path="*" element={<ErrorPage />} />
              </Routes>
            </LoadScript>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
