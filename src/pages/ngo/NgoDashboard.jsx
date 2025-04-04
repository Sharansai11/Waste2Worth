import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
  getTotalWasteCollectedByNGO, 
  getAllVolunteers 
} from "../../services/wasteService";
import { useNavigate, Link } from "react-router-dom";
import {   
  Container,   
  Card,   
  Alert,   
  Row,   
  Col,   
  Spinner 
} from "react-bootstrap";
import { 
  FaUsers, 
  FaRecycle, 
  FaLeaf 
} from "react-icons/fa";

const NGODashboard = () => {
  const { user, role, name } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [totalWasteCollected, setTotalWasteCollected] = useState(0);
  const navigate = useNavigate();

  // Inspirational quotes about environmental impact
  const sustainabilityQuotes = [
    "We don't inherit the earth from our ancestors, we borrow it from our children.",
    "Small acts, when multiplied by millions of people, can transform the world.",
    "Every great change starts with a small step towards sustainability.",
    "Empowering volunteers, one waste collection at a time."
  ];

  // Random quote selector
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * sustainabilityQuotes.length);
    return sustainabilityQuotes[randomIndex];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || role !== "ngo") {
        setError("Unauthorized access. Redirecting...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        // Fetch volunteers for this NGO
        const volunteers = await getAllVolunteers();
        const ngoVolunteers = volunteers.filter(v => v.ngoId === user.uid);
        setVolunteerCount(ngoVolunteers.length);

        // Fetch total waste collected
        const wasteCollected = await getTotalWasteCollectedByNGO(user.uid);
        setTotalWasteCollected(wasteCollected);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, role, navigate]);

  if (!user || role !== "ngo") {
    return (
      <Container className="py-4">
        <Alert variant="danger">Unauthorized access. Redirecting...</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-lg p-4 border-0" style={{ borderLeft: "5px solid #3e9f65" }}>
        <h2 className="text-center text-success mb-3">
          Welcome, {name} 🌿
        </h2>
        <p className="text-center text-muted fst-italic mb-4">
          "{getRandomQuote()}"
        </p>

        <Row className="g-3">
          <Col md={6}>
            <Card 
              className="h-100 border border-3 border-dark border-opacity-25 text-center shadow-sm rounded-4"
            >
              <div className="p-3">
                <FaUsers size={30} className="text-success mb-2" />
                <h5>
                  {loading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    volunteerCount
                  )}
                </h5>
                <p className="text-muted">Registered Volunteers</p>
              </div>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card 
              className="h-100 border border-3 border-dark border-opacity-25 text-center shadow-sm rounded-4"
            >
              <div className="p-3">
                <FaRecycle size={30} className="text-warning mb-2" />
                <h5>
                  {loading ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    `${totalWasteCollected.toFixed(2)} kg`
                  )}
                </h5>
                <p className="text-muted">Total Waste Collected</p>
              </div>
            </Card>
          </Col>
        </Row>

        <Row className="mt-3 g-3">
          <Col md={6}>
            <Link 
              to="/ngo/volunteers" 
              className="btn btn-outline-success w-100"
            >
              Manage Volunteers
            </Link>
          </Col>
          <Col md={6}>
            <Link 
              to="/ngo/bulk-upload" 
              className="btn btn-outline-primary w-100"
            >
              Add New Volunteers
            </Link>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Card>
    </Container>
  );
};

export default NGODashboard;