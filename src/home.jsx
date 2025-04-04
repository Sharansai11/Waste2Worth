import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./home.css"; // Custom styles
import { FaRecycle, FaUsers, FaLeaf } from "react-icons/fa"; // Icons

const HomePage = () => {
  const [wasteCollected, setWasteCollected] = useState(1200);
  const [volunteers, setVolunteers] = useState(200);
  const [recyclers, setRecyclers] = useState(50);

  useEffect(() => {
    const interval = setInterval(() => {
      setWasteCollected((prev) => prev + Math.floor(Math.random() * 10 + 1));
      setVolunteers((prev) => prev + Math.floor(Math.random() * 2));
      setRecyclers((prev) => prev + Math.floor(Math.random() * 1));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homepage-container d-flex flex-column min-vh-100">
      {/* Hero Section */}
      <div className="hero-section d-flex align-items-center justify-content-between p-5">
        <div className="hero-text">
          <h1 className="display-4 fw-bold text-success">
            Transforming Waste into Opportunity 🌍
          </h1>
          <h2 className="h4 mt-2 text-muted">
            AI-Powered Smart Waste Collection & Recycling
          </h2>
          <p className="mt-3 lead text-dark">
            Join us in optimizing waste detection, collection, and recycling
            with AI-driven technology for a cleaner and greener future.
          </p>

          <div className="mt-4 d-flex gap-3">
            <Link to="/signup" className="btn btn-success px-4 py-2 shadow">
              Get Involved
            </Link>
            <button
              className="btn btn-outline-dark px-4 py-2 shadow"
              onClick={() =>
                document.getElementById("impact-section").scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://thumbs.dreamstime.com/b/eco-concept-recycling-symbol-table-background-top-view-garbage-wooden-88530524.jpg"
            alt="Hero"
            className="img-fluid rounded shadow-lg"
          />
        </div>
      </div>

      {/* SDG & Impact Section */}
      <section id="sdg-section" className="container py-5">
        <h2 className="text-center text-success fw-bold mb-4">
          ♻️ Driving Sustainable Change
        </h2>
        <p className="text-center text-muted">
          Our initiative supports key United Nations Sustainable Development
          Goals (SDGs):
        </p>
        <ul className="list-group list-group-flush text-center">
          <li className="list-group-item">
            ✅ <strong>SDG 1 (No Poverty)</strong> – Creating economic
            opportunities for waste collectors and recyclers.
          </li>
          <li className="list-group-item">
            ✅ <strong>SDG 11 (Sustainable Cities & Communities)</strong> –
            Promoting clean cities through smart waste management.
          </li>
          <li className="list-group-item">
            ✅ <strong>SDG 12 (Responsible Consumption & Production)</strong> –
            Encouraging sustainable waste disposal and recycling.
          </li>
        </ul>
      </section>

      {/* Impact Counter Section */}
      <section id="impact-section" className="container py-5">
        <h2 className="text-center text-success fw-bold mb-4">
          🌍 Our Impact So Far
        </h2>
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <div className="card impact-card shadow-sm">
              <div className="card-body">
                <FaRecycle className="icon text-success" />
                <h3 className="display-6 fw-bold">{wasteCollected} kg</h3>
                <p className="text-muted">Total Waste Collected</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card impact-card shadow-sm">
              <div className="card-body">
                <FaUsers className="icon text-warning" />
                <h3 className="display-6 fw-bold">{volunteers}</h3>
                <p className="text-muted">Volunteers Registered</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card impact-card shadow-sm">
              <div className="card-body">
                <FaLeaf className="icon text-danger" />
                <h3 className="display-6 fw-bold">{recyclers}</h3>
                <p className="text-muted">Recyclers Connected</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
