import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Container, Card, Alert, Row, Col, Spinner, Button } from "react-bootstrap";
import { FaRecycle, FaGlobeAmericas, FaLeaf } from "react-icons/fa";

const RecyclerDashboard = () => {
  const { user, role, name } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalWasteProcessed, setTotalWasteProcessed] = useState(0);
  const navigate = useNavigate();

  // Inspirational quotes about recycling and sustainability
  const sustainabilityQuotes = [
    "Recycling is a gift we give to our planet.",
    "Every piece recycled is a step towards a cleaner world.",
    "Transform waste into opportunity, one kg at a time.",
    "Your recycling efforts create ripples of positive change.",
    "Sustainability starts with a single conscious choice."
  ];

  // SDG-related insights for recyclers
  const sdgInsights = [
    {
      icon: <FaLeaf className="text-success" size={30} />,
      title: "Responsible Consumption",
      description: "Your recycling directly supports UN SDG 12, promoting sustainable consumption patterns.",
      sdgNumber: 12
    },
    {
      icon: <FaGlobeAmericas className="text-info" size={30} />,
      title: "Climate Action",
      description: "By recycling, you're taking critical steps towards UN SDG 13, combating climate change.",
      sdgNumber: 13
    }
  ];

  // Function to get a random quote
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * sustainabilityQuotes.length);
    return sustainabilityQuotes[randomIndex];
  };

  useEffect(() => {
    if (!user || role !== "recycler") {
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    const fetchData = async () => {
      try {
        const wasteRef = collection(db, "wasteRecords");
        const q = query(wasteRef, where("recyclerId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        let totalProcessed = 0;
        snapshot.forEach((doc) => {
          totalProcessed += doc.data().weight || 0;
        });

        setTotalWasteProcessed(totalProcessed);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, role, navigate]);

  // If no user or not a recycler, show error
  if (!user || role !== "recycler") {
    return (
      <Container className="py-4">
        <Alert variant="danger">Unauthorized access. Redirecting...</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-lg p-4 border-0" style={{ borderLeft: "5px solid #3e9f65" }}>
        <h2 className="text-success mb-3">Hello, {name} 🌿</h2>
        <p className="text-muted fst-italic mb-4">
          "{getRandomQuote()}"
        </p>

        <Row className="mb-4">
          <Col md={12}>
            <Card className="text-center shadow-sm p-3">
              <FaRecycle size={30} className="text-success mb-2" />
              <h5>
                {loading ? <Spinner size="sm" animation="border" /> : `${totalWasteProcessed} kg`}
              </h5>
              <p className="text-muted">Total Waste Processed</p>
            </Card>
          </Col>
        </Row>

        <Row className="g-3">
          {sdgInsights.map((insight, index) => (
            <Col md={6} key={index}>
              <Card className="h-100 text-center shadow-sm">
                <Card.Body>
                  {insight.icon}
                  <h5 className="mb-3 mt-3">{insight.title}</h5>
                  <p className="text-muted mb-3">
                    {insight.description}
                  </p>
                  <Button 
                    variant="outline-success" 
                    onClick={() => window.open(`https://sdgs.un.org/goals/goal${insight.sdgNumber}`, '_blank')}
                  >
                    Learn About SDG {insight.sdgNumber}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card>
    </Container>
  );
};

export default RecyclerDashboard;