import React, { useState, useEffect } from "react";
import { Container, Row, Button, ButtonGroup, Alert, Spinner } from "react-bootstrap";
import { PostCard, DetailModal } from "./PostItem";
import PostForm from "./PostForm";
import { getContributorWastePosts, deleteWastePost } from "../../services/wasteService";
import { getUserById } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { PlusCircle, Clock, CheckCircle, Trash } from "react-bootstrap-icons";

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [showPostForm, setShowPostForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState(""); 
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [acceptedUser, setAcceptedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId, role } = useAuth();

  useEffect(() => {
    if (userId) fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getContributorWastePosts(userId);
      setPosts(data);
    } catch (err) {
      setError("Failed to fetch posts: " + err.message);
    }
    setLoading(false);
  };

  const handleFilterChange = (status) => setFilter(status);

  const filteredPosts = posts.filter((post) => {
    if (filter === "pending") return post.status === "pending";
    if (filter === "accepted") return post.status === "accepted";
    if (filter === "collected") return post.status === "collected";
    return true;
  });

  const handlePostCreated = () => {
    fetchPosts();
    setShowPostForm(false);
  };

  const handleCardClick = async (post) => {
    setSelectedPost(post);
    if (post.acceptedBy) {
      try {
        const userData = await getUserById(post.acceptedBy);
        setAcceptedUser(userData);
      } catch (err) {
        console.error("Error fetching accepted user:", err);
      }
    } else {
      setAcceptedUser(null);
    }
    setDetailModalVisible(true);
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setShowEditForm(true);
    setDetailModalVisible(false);
  };

  const handlePostUpdated = () => {
    fetchPosts();
    setShowEditForm(false);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteWastePost(postId);
      fetchPosts();
      setDetailModalVisible(false);
    } catch (err) {
      setError("Error deleting post: " + err.message);
    }
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedPost(null);
    setAcceptedUser(null);
  };

  return (
    <Container className="mt-4">
      <h2 className="text-success">♻️ My Waste Posts</h2>
      <Button variant="success"  onClick={() => setShowPostForm(true)} className="mb-3 me-3 mr-2">
  <PlusCircle className="me-2" /> Add New Post
</Button>

{posts.length > 0 && (
  <ButtonGroup className="mb-3">
    <Button variant={filter === "pending" ? "success" : "outline-success"} onClick={() => handleFilterChange("pending")}>
      <Clock className="me-2" /> Requested
    </Button>
    <Button variant={filter === "accepted" ? "primary" : "outline-primary"} onClick={() => handleFilterChange("accepted")}>
      <CheckCircle className="me-2" /> Accepted
    </Button>
    <Button variant={filter === "collected" ? "dark" : "outline-dark"} onClick={() => handleFilterChange("collected")}>
     Previously sold waste
    </Button>
  </ButtonGroup>
)}

      <Row className="mt-4">
        {loading ? (
          <Spinner animation="border" className="m-4 text-success" />
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onClick={handleCardClick} 
              onEdit={handleEditPost} 
              onDelete={handleDeletePost} 
              role={role} 
            />
          ))
        ) : (
          <Alert variant="info" className="m-4">
            No posts found. Add a new post to get started.
          </Alert>
        )}
      </Row>

      <PostForm
        show={showPostForm}
        onHide={() => setShowPostForm(false)}
        onPostCreated={handlePostCreated}
        setError={setError}
      />

      {showEditForm && (
        <PostForm
          show={showEditForm}
          onHide={() => setShowEditForm(false)}
          onPostCreated={handlePostUpdated}
          setError={setError}
          editMode={true}
          postToEdit={selectedPost}
        />
      )}

      <DetailModal
        show={detailModalVisible}
        onHide={closeDetailModal}
        post={selectedPost}
        acceptedUser={acceptedUser}
        role={role}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />
    </Container>
  );
};

export default MyPosts;
