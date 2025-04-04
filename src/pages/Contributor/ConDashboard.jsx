
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { PersonFill, Recycle, ClockFill, CheckCircleFill } from "react-bootstrap-icons";
import { useAuth } from "../../context/AuthContext";
import { getContributorWastePosts } from "../../services/wasteService";

const ContributorDashboard = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState(0);
  const [wasteRecycled, setWasteRecycled] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);
  const [acceptedPosts, setAcceptedPosts] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const posts = await getContributorWastePosts(user.uid);
        
        // Total contributions = total posts created by contributor
        setContributions(posts.length);

        // Count pending and accepted posts
        setPendingPosts(posts.filter(post => post.status === "pending").length);
        setAcceptedPosts(posts.filter(post => post.status === "accepted").length);

        // Total waste recycled = sum of quantity from posts with status "collected"
        let total = 0;
        posts.forEach((post) => {
          if (post.status === "collected") {
            let qty = 0;
            if (typeof post.quantity === "number") {
              qty = post.quantity;
            } else if (typeof post.quantity === "string") {
              // Remove non-numeric characters (like "kg") and parse the number
              const numericPart = post.quantity.replace(/[^\d.]/g, "");
              qty = parseFloat(numericPart) || 0;
            }
            total += qty;
          }
        });

        setWasteRecycled(Number(total.toFixed(2)));
      } catch (err) {
        console.error("Error fetching waste posts:", err);
        setError("Failed to fetch your posts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="container py-5">
      {/* Dashboard Header */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-success">🌱 Contributor Dashboard</h1>
        <p className="lead text-muted">
          "Waste isn't waste until we waste it." – Will.i.am
        </p>
        <p className="text-dark">
          Turn your waste into value! Track your contributions and sell recyclables to promote a cleaner and sustainable environment.
        </p>
      </div>

      {/* Impact Cards Section */}
      <div className="row g-4 text-center">
        <DashboardCard
          icon={<PersonFill size={40} className="text-primary" />}
          value={loading ? <span>Loading...</span> : contributions}
          label="Total Contributions"
        />
        <DashboardCard
          icon={<Recycle size={40} className="text-success" />}
          value={loading ? <span>Loading...</span> : `${wasteRecycled} kg`}
          label="Waste Recycled"
        />
        <div className="col-md-4">
          <div className="card shadow-sm border-0">
            <div className="card-body py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <ClockFill size={40} className="text-warning mb-2" />
                  <h3 className="fw-bold">{loading ? 'Loading...' : pendingPosts}</h3>
                  <p className="text-muted">Pending Posts</p>
                </div>
                <div>
                  <CheckCircleFill size={40} className="text-success mb-2" />
                  <h3 className="fw-bold">{loading ? 'Loading...' : acceptedPosts}</h3>
                  <p className="text-muted">Accepted Posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mt-5">
        <Link to="/contributor/my-posts" className="btn btn-success btn-lg px-4">
          Sell Waste
        </Link>
        <Link to="/common/nearby-recyclers" className="btn btn-outline-dark btn-lg px-4">
          Near By Scrap Shops
        </Link>
      </div>

      {error && <p className="text-danger mt-3 text-center">{error}</p>}
    </div>
  );
};

const DashboardCard = ({ icon, value, label }) => (
  <div className="col-md-4">
    <div className="card shadow-sm border-0">
      <div className="card-body py-4">
        {icon}
        <h3 className="fw-bold mt-2">{value}</h3>
        <p className="text-muted">{label}</p>
      </div>
    </div>
  </div>
);

export default ContributorDashboard;