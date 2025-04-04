import React from "react";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css"; // Ensure you import the CSS file

const Sidebar = () => {
  const { role } = useAuth(); // Get role from AuthContext

  if (!role) return null; // Hide sidebar if no role is assigned

  return (
    <div className="sidebar-container d-flex flex-column">
      <Nav className="sidebar-nav flex-column">
        {/* Contributor Section */}
        {role === "contributor" && (
          <>
            <h6 className="sidebar-header">Contributor</h6>
            <Nav.Link as={Link} to="/contributor/dashboard" className="sidebar-link">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/contributor/ai-detection" className="sidebar-link">
              AI Waste Detection
            </Nav.Link>
            <Nav.Link as={Link} to="/contributor/my-posts" className="sidebar-link">
              My Posts
            </Nav.Link>
            <Nav.Link as={Link} to="/common/nearby-recyclers" className="sidebar-link">
              Nearby Recyclers / Scrap Shops
            </Nav.Link>
            <hr className="sidebar-divider" />
          </>
        )}

        {/* Volunteer Section */}
        {role === "volunteer" && (
          <>
            <h6 className="sidebar-header">Volunteer</h6>
            <Nav.Link as={Link} to="/volunteer/dashboard" className="sidebar-link">
              Volunteer Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/view-posts" className="sidebar-link">
              View Posts
            </Nav.Link>
            <Nav.Link as={Link} to="/optimized-route" className="sidebar-link">
              Optimized Route
            </Nav.Link>
            <Nav.Link as={Link} to="/common/nearby-recyclers" className="sidebar-link">
              Nearby Recyclers / Scrap Shops
            </Nav.Link>
            <hr className="sidebar-divider" />
          </>
        )}

        {/* Recycler Section */}
        {role === "recycler" && (
          <>
            <h6 className="sidebar-header">Recycler</h6>
            <Nav.Link as={Link} to="/recycler/dashboard" className="sidebar-link">
              Recycler Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/view-posts" className="sidebar-link">
              View Posts
            </Nav.Link>
            <Nav.Link as={Link} to="/optimized-route" className="sidebar-link">
              Optimized Route
            </Nav.Link>
            <hr className="sidebar-divider" />
          </>
        )}

        {/* NGO Section */}
        {role === "ngo" && (
          <>
            <h6 className="sidebar-header">NGO Management</h6>
            <Nav.Link as={Link} to="/ngo/dashboard" className="sidebar-link">
              NGO Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/ngo/volunteers" className="sidebar-link">
              Manage Volunteers
            </Nav.Link>
            <Nav.Link as={Link} to="/ngo/bulk-upload" className="sidebar-link">
              Bulk Volunteer Upload
            </Nav.Link>
            <hr className="sidebar-divider" />
          </>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;
