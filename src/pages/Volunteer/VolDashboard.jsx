import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { 
  Container, 
  Card, 
  Row, 
  Col, 
  ListGroup, 
  Button, 
  Badge, 
  ProgressBar,
  Tabs,
  Tab,
  Alert
} from "react-bootstrap";
import { 
  PersonFill, 
  Recycle, 
  TreeFill, 
  DropletFill, 
  Award, 
  Star, 
  GeoAltFill,
  Globe2,
  Calendar3,
  ChatLeftTextFill
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { getVolunteerStats } from "../../services/wasteService";
import { getTotalUnreadCount } from "../../services/chatService";

const VolDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    totalWasteCollected: 0, 
    totalPosts: 0,
    impactMetrics: {
      co2Saved: 0,
      waterSaved: 0,
      treesPreserved: 0,
      landfillSpaceSaved: 0
    },
    wasteByType: {
      plastic: 0,
      paper: 0,
      electronics: 0,
      organic: 0,
      metal: 0,
      glass: 0,
      other: 0
    },
    recentCollections: []
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetching stats from server
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get volunteer stats
        const volunteerStats = await getVolunteerStats(user.uid);
        
        // Calculate impact metrics based on waste collected
        // These calculations are examples and should be adjusted based on real data
        const totalWaste = volunteerStats.totalWasteCollected || 0;
        const impactMetrics = {
          co2Saved: (totalWaste * 2.5).toFixed(2), // kg of CO2 saved
          waterSaved: (totalWaste * 1000).toFixed(0), // liters of water saved
          treesPreserved: (totalWaste * 0.017).toFixed(2), // trees preserved
          landfillSpaceSaved: (totalWaste * 0.001).toFixed(3) // cubic meters saved
        };
        
        // Sample waste type distribution - replace with real data
        const wasteByType = {
          plastic: Math.round(totalWaste * 0.35),
          paper: Math.round(totalWaste * 0.25),
          electronics: Math.round(totalWaste * 0.05),
          organic: Math.round(totalWaste * 0.20),
          metal: Math.round(totalWaste * 0.08),
          glass: Math.round(totalWaste * 0.05),
          other: Math.round(totalWaste * 0.02)
        };
        
        setStats({
          ...volunteerStats,
          impactMetrics,
          wasteByType,
          recentCollections: volunteerStats.recentCollections || []
        });
      } catch (err) {
        console.error("Error fetching volunteer stats:", err);
      }
    };
    
    const fetchUnreadMessages = async () => {
      if (user && user.uid) {
        const count = await getTotalUnreadCount(user.uid);
        setUnreadCount(count);
      }
    };
    
    if (user) {
      fetchStats();
      fetchUnreadMessages();
      
      // Check for new messages every minute
      const interval = setInterval(fetchUnreadMessages, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const sdgGoals = [
    {
      number: 11,
      title: "Sustainable Cities and Communities",
      contribution: "You've helped create cleaner urban spaces by removing waste"
    },
    {
      number: 12,
      title: "Responsible Consumption and Production",
      contribution: "You've promoted recycling and reduced waste sent to landfills"
    },
    {
      number: 13,
      title: "Climate Action",
      contribution: `You've prevented ${stats.impactMetrics.co2Saved} kg of CO2 emissions`
    },
    {
      number: 15,
      title: "Life on Land",
      contribution: `You've helped preserve ecosystems by diverting waste from nature`
    }
  ];
  
  if (!user) return <p className="text-center mt-5">Loading...</p>;
  
  return (
    <Container className="mt-4 pb-5">
     
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
        fill
      >
        <Tab eventKey="overview" title={<strong>Impact Dashboard</strong>} className="fw-bold">
          {/* Impact Summary */}
          <Row className="mb-4 g-3">
            <Col md={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex p-3 mb-3">
                    <Recycle className="text-success" size={36} />
                  </div>
                  <h3 className="mb-0">{stats.totalWasteCollected} kg</h3>
                  <p className="text-muted mb-0">Total Waste Collected</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-inline-flex p-3 mb-3">
                    <DropletFill className="text-primary" size={36} />
                  </div>
                  <h3 className="mb-0">{stats.impactMetrics.waterSaved} L</h3>
                  <p className="text-muted mb-0">Water Saved</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="rounded-circle bg-danger bg-opacity-10 d-inline-flex p-3 mb-3">
                    <Globe2 className="text-danger" size={36} />
                  </div>
                  <h3 className="mb-0">{stats.impactMetrics.co2Saved} kg</h3>
                  <p className="text-muted mb-0">CO₂ Emissions Prevented</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Body className="text-center">
                  <div className="rounded-circle bg-warning bg-opacity-10 d-inline-flex p-3 mb-3">
                    <TreeFill className="text-warning" size={36} />
                  </div>
                  <h3 className="mb-0">{stats.impactMetrics.treesPreserved}</h3>
                  <p className="text-muted mb-0">Trees Preserved</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* SDG Goals Impact */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbYRDppsVe27iyx8GFmRyF0SkRE6LfbHhxkw&s" 
                  alt="SDG Logo" 
                  height="50" 
                  className="me-2" 
                />
                Your Contribution to UN Sustainable Development Goals
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {sdgGoals.map(goal => (
                  <Col md={6} key={goal.number}>
                    <Card className="border-0 h-100" style={{ backgroundColor: '#f8f9fa' }}>
                      <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                          <div 
                            className="rounded-circle text-white d-flex align-items-center justify-content-center me-3" 
                            style={{ 
                              width: '40px', 
                              height: '40px',
                              backgroundColor: goal.number === 11 ? '#fd9d24' : 
                                               goal.number === 12 ? '#bf8b2e' : 
                                               goal.number === 13 ? '#3f7e44' : '#56c02b'
                            }}
                          >
                            <strong>{goal.number}</strong>
                          </div>
                          <h5 className="mb-0">{goal.title}</h5>
                        </div>
                        <p className="mb-0 text-muted">{goal.contribution}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
          
          {/* Call to Action */}
          <Card className="text-center shadow-sm mb-4 border-0 bg-gradient" style={{ background: 'linear-gradient(135deg, #3e9f65 0%, #56c02b 100%)' }}>
            <Card.Body className="py-4 text-white">
              <h4>Ready to make a bigger impact?</h4>
              <p>Find more waste collection opportunities near you</p>
              <Link to="/view-posts" className="btn btn-light btn-lg px-4">
                <GeoAltFill className="" />
                Find Nearby Collections
              </Link>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="stats" title={<strong>Detailed Statistics</strong>}>
          <Row className="g-4">
            
            <Col md={6}>
              <Card className="shadow-sm h-100 border-0">
                <Card.Header className="bg-white border-0">
                  <h5 className="mb-0">
                    <Award className="me-2 text-success" />
                    Your Environmental Impact
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="px-0 py-3 border-bottom">
                      <div className="d-flex">
                        <div className="me-3">
                          <Globe2 size={24} className="text-danger" />
                        </div>
                        <div>
                          <h6 className="mb-1">CO₂ Emissions Prevented</h6>
                          <p className="mb-0 text-muted">Equivalent to not driving a car for {Math.round(stats.impactMetrics.co2Saved / 2.3)} km</p>
                          <div className="mt-2">
                            <strong>{stats.impactMetrics.co2Saved} kg</strong>
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    
                    <ListGroup.Item className="px-0 py-3 border-bottom">
                      <div className="d-flex">
                        <div className="me-3">
                          <DropletFill size={24} className="text-primary" />
                        </div>
                        <div>
                          <h6 className="mb-1">Water Conservation</h6>
                          <p className="mb-0 text-muted">Equivalent to {Math.round(stats.impactMetrics.waterSaved / 150)} showers</p>
                          <div className="mt-2">
                            <strong>{stats.impactMetrics.waterSaved} liters</strong>
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                   
                   
                    <ListGroup.Item className="px-0 py-3 border-bottom">
                      <div className="d-flex">
                        <div className="me-3">
                          <TreeFill size={24} className="text-success" />
                        </div>
                        <div>
                          <h6 className="mb-1">Trees Preserved</h6>
                          <p className="mb-0 text-muted">By recycling paper and cardboard waste</p>
                          <div className="mt-2">
                            <strong>{stats.impactMetrics.treesPreserved} trees</strong>
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                    
                    <ListGroup.Item className="px-0 py-3">
                      <div className="d-flex">
                        <div className="me-3">
                          <GeoAltFill size={24} className="text-warning" />
                        </div>
                        <div>
                          <h6 className="mb-1">Landfill Space Saved</h6>
                          <p className="mb-0 text-muted">Space that won't be used for waste disposal</p>
                          <div className="mt-2">
                            <strong>{stats.impactMetrics.landfillSpaceSaved} m³</strong>
                          </div>
                        </div>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Total Posts and Collection Rate */}
          <Row className="mt-4 g-4">
            <Col md={12}>
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-0">
                  <h5 className="mb-0">
                    <Star className="me-2 text-warning" />
                    Collection Achievements
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4} className="text-center mb-3 mb-md-0">
                      <div className="rounded-circle mx-auto bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <h1 className="mb-0">{stats.totalPosts}</h1>
                      </div>
                      <h5 className="mt-3">Total Collections</h5>
                      <p className="text-muted">Waste posts you've collected</p>
                    </Col>
                    
                    <Col md={4} className="text-center mb-3 mb-md-0">
                      <div className="rounded-circle mx-auto bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <h1 className="mb-0">{Math.round(stats.totalWasteCollected / (stats.totalPosts || 1))}</h1>
                      </div>
                      <h5 className="mt-3">Avg. Collection</h5>
                      <p className="text-muted">Kilograms per collection</p>
                    </Col>
                    
                    <Col md={4} className="text-center">
                      <div className="rounded-circle mx-auto bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <h1 className="mb-0">{Math.min(Math.round(stats.totalPosts / 5), 5)}</h1>
                      </div>
                      <h5 className="mt-3">Impact Level</h5>
                      <p className="text-muted">On a scale of 1-5</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
        
       
      </Tabs>
      
      {/* Call to Action */}
      
      <div className="d-flex justify-content-center align-items-center">
  <Link
    to="/view-posts"
    className="btn btn-success btn-lg w-100 d-flex align-items-center justify-content-center"
    style={{ height: '80px', maxWidth: '500px' }} // optional maxWidth to control size
  >
    <Recycle className="me-3" size={30} />
    <div className="text-start">
      <strong>Collect Waste</strong>
      <div className="small">Find waste posts near you</div>
    </div>
  </Link>
</div>

      {/* Custom CSS for timeline */}
      <style jsx>{`
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .timeline:before {
          content: '';
          position: absolute;
          top: 0;
          left: 15px;
          height: 100%;
          width: 2px;
          background: #3e9f65;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 25px;
        }
        
        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 5px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #3e9f65;
          border: 3px solid white;
        }
        
        .timeline-content {
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
      `}</style>
    </Container>
  );
};

export default VolDashboard;