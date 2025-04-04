import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { deleteVolunteer } from "../../services/authService";
import {
  Form,
  Table,
  Container,
  Card,
  Alert,
  Spinner,
  Button,
  Modal,
} from "react-bootstrap";
import { db } from "../../firebaseConfig";
import { geocodeLatLng } from "../../services/mapsService";
import { BsTrash, BsSearch, BsPersonFill } from "react-icons/bs";

const NGOVolunteers = () => {
  const { user, role } = useAuth();
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerAddresses, setVolunteerAddresses] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState(null);

  useEffect(() => {
    if (!user || role !== "ngo") {
      setError("Unauthorized access.");
      setLoading(false);
      return;
    }
    const fetchVolunteers = async () => {
      try {
        const volunteersRef = collection(db, "users");
        const q = query(volunteersRef, where("ngoId", "==", user.uid));
        const snapshot = await getDocs(q);
        const volunteersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          contact: doc.data().contact || "N/A",
          location: doc.data().location,
        }));
        setVolunteers(volunteersList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching volunteers:", err);
        setError("Failed to fetch volunteers.");
        setLoading(false);
      }
    };
    fetchVolunteers();
  }, [user, role]);

  useEffect(() => {
    volunteers.forEach((vol) => {
      if (vol.location && !volunteerAddresses[vol.id]) {
        geocodeLatLng(vol.location.latitude, vol.location.longitude)
          .then((address) => {
            setVolunteerAddresses((prev) => ({
              ...prev,
              [vol.id]: address,
            }));
          })
          .catch((err) =>
            console.error(`Reverse geocode error for volunteer ${vol.id}:`, err)
          );
      }
    });
  }, [volunteers, volunteerAddresses]);

  const confirmDeleteVolunteer = (volunteer) => {
    setVolunteerToDelete(volunteer);
    setShowDeleteModal(true);
  };

  const handleDeleteVolunteer = async () => {
    if (volunteerToDelete) {
      try {
        await deleteVolunteer(volunteerToDelete.id);
        setVolunteers((prev) => prev.filter((v) => v.id !== volunteerToDelete.id));
      } catch (err) {
        console.error("Error deleting volunteer:", err);
        setError("Failed to delete volunteer.");
      }
      setShowDeleteModal(false);
      setVolunteerToDelete(null);
    }
  };

  const renderVolunteerAddress = (vol) => {
    if (!vol.location) return "N/A";
    return volunteerAddresses[vol.id] || "Loading address...";
  };

  return (
    <Container className="py-4">
      <Card className="shadow p-4 border-0">
        <h4 className="text-primary mb-3 d-flex align-items-center">
          <BsPersonFill className="me-2" /> Manage Volunteers
        </h4>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <Spinner animation="border" variant="primary" />}

        <div className="d-flex mb-3">
          <Form.Control
            type="text"
            placeholder="Search volunteers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="me-2"
          />
          <Button variant="primary">
            <BsSearch />
          </Button>
        </div>

        {volunteers.length > 0 ? (
          <Table striped bordered hover responsive>
            <thead className="table-secondary">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {volunteers
                .filter((vol) =>
                  vol.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((vol) => (
                  <tr key={vol.id}>
                    <td>{vol.name}</td>
                    <td>{vol.email}</td>
                    <td>{vol.contact}</td>
                    <td>{renderVolunteerAddress(vol)}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => confirmDeleteVolunteer(vol)}
                      >
                        <BsTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        ) : (
          !loading && <p className="text-center text-muted">No volunteers found.</p>
        )}
      </Card>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {volunteerToDelete && (
            <p>
              Are you sure you want to delete <strong>{volunteerToDelete.name}</strong>?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteVolunteer}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default NGOVolunteers;