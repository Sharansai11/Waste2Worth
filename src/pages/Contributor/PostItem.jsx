// src/components/MyPosts/PostItem.jsx
import React, { useState, useEffect } from "react";
import { Card, Col, Modal, Button, Row, Badge, Image } from "react-bootstrap";
import { format } from "date-fns";
import { PencilSquare, Trash2Fill, ChatDots } from "react-bootstrap-icons";
import { createChat, getChatWithUnreadCount } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import ChatModal from "../Common/ChatModal";




// Now update the PostCard component
export const PostCard = ({ post, onClick, onEdit, onDelete, role }) => {
  const { status, wasteType, quantity, availableDate, createdAt, sellForFree, imageUrl } = post;
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userId } = useAuth();
  
  // Check for unread messages when component mounts
  useEffect(() => {
    const checkUnreadMessages = async () => {
      if (post.status === "accepted" && ((role === "contributor" && post.acceptedBy) || 
          (role === "volunteer" || role === "recycler"))) {
        const chatInfo = await getChatWithUnreadCount(post.id, userId);
        if (chatInfo && chatInfo.unreadCount > 0) {
          setUnreadCount(chatInfo.unreadCount);
          setChatId(chatInfo.chatId);
        }
      }
    };
    
    checkUnreadMessages();
    
    // Set up polling interval (optional)
    const interval = setInterval(checkUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [post.id, post.status, post.acceptedBy, userId, role]);
  
  const getStatusVariant = () => {
    if (status === "pending") return "warning";
    if (status === "accepted") return "primary";
    if (status === "collected") return "success";
    return "secondary";
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === "string") return date;
    if (date.toDate) {
      return format(date.toDate(), "MMM dd, yyyy");
    }
    return format(new Date(date), "MMM dd, yyyy");
  };

  const handleCardClick = (e) => {
    // Prevent card click if clicking on action buttons
    if (e.target.closest(".card-actions")) return;
    onClick(post);
  };

  const handleChatClick = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      // Determine the other user ID based on the post status
      const otherUserId = role === "contributor" ? post.acceptedBy : post.contributorId;
      
      // Only allow chat if post is accepted and has an acceptedBy user
      if (post.status !== "accepted" || !otherUserId) {
        alert("Chat is only available for accepted posts");
        return;
      }
      
      // Create or get existing chat
      const newChatId = await createChat(post.id, post.contributorId, otherUserId);
      setChatId(newChatId);
      setShowChatModal(true);
    } catch (error) {
      console.error("Error initiating chat:", error);
      alert("Failed to open chat. Please try again.");
    }
  };

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card
        className={`h-100 shadow-sm post-card ${unreadCount > 0 ? 'border-danger' : ''}`}
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        {imageUrl && (
          <div style={{ height: "150px", overflow: "hidden" }}>
            <Card.Img
              variant="top"
              src={imageUrl}
              alt={wasteType}
              style={{ objectFit: "cover", height: "100%", width: "100%" }}
            />
          </div>
        )}
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="mb-0">{wasteType}</Card.Title>
            <Badge bg={getStatusVariant()}>{status}</Badge>
          </div>
          <Card.Text>
            <strong>Quantity:</strong> {quantity} kg
            <br />
            <strong>Available:</strong> {formatDate(availableDate)}
            <br />
            <strong>Posted:</strong> {formatDate(createdAt)}
            {sellForFree && (
              <>
                <br />
                <Badge bg="success">Free</Badge>
              </>
            )}
          </Card.Text>
          <div className="card-actions d-flex justify-content-end mt-auto">
            {/* Show chat button with notification badge if needed */}
            {post.status === "accepted" && ((role === "contributor" && post.acceptedBy) || 
                (role === "volunteer" || role === "recycler")) && (
              <Button
                variant={unreadCount > 0 ? "danger" : "outline-primary"}
                size="sm"
                className="me-2"
                onClick={handleChatClick}
              >
                <ChatDots className="me-1" /> 
                Chat
                {unreadCount > 0 && (
                  <Badge 
                    bg="light" 
                    text="danger" 
                    pill 
                    className="ms-1"
                    style={{ fontSize: '0.65rem', position: 'relative', top: '-1px' }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {post.status === "pending" && role === "contributor" && (
              <>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(post);
                  }}
                >
                  <PencilSquare />
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this post?")) {
                      onDelete(post.id);
                    }
                  }}
                >
                  <Trash2Fill />
                </Button>
              </>
            )}
          </div>
        </Card.Body>
        
        {/* Add a visual indicator for unread messages */}
        {unreadCount > 0 && (
          <div 
            className="position-absolute" 
            style={{ 
              top: '0', 
              right: '0', 
              width: '20px', 
              height: '20px', 
              backgroundColor: '#dc3545',
              borderRadius: '0 0 0 20px'
            }}
          ></div>
        )}
      </Card>
      
      {showChatModal && (
        <ChatModal
          show={showChatModal}
          onHide={() => {
            setShowChatModal(false);
            // Reset unread count after viewing
            setUnreadCount(0);
          }}
          chatId={chatId}
          postId={post.id}
          otherUserId={role === "contributor" ? post.acceptedBy : post.contributorId}
        />
      )}
    </Col>
  );
};

// Also update the DetailModal component to show notification badges
export const DetailModal = ({ show, onHide, post, acceptedUser, role, onEdit, onDelete }) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userId } = useAuth();

  useEffect(() => {
    // Check for unread messages when post details are shown
    const checkUnreadMessages = async () => {
      if (post && post.status === "accepted") {
        const chatInfo = await getChatWithUnreadCount(post.id, userId);
        if (chatInfo && chatInfo.unreadCount > 0) {
          setUnreadCount(chatInfo.unreadCount);
          setChatId(chatInfo.chatId);
        }
      }
    };
    
    if (show) {
      checkUnreadMessages();
    }
  }, [post, userId, show]);

  if (!post) return null;

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === "string") return date;
    if (date.toDate) {
      return format(date.toDate(), "MMMM dd, yyyy");
    }
    return format(new Date(date), "MMMM dd, yyyy");
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const getStatusBadge = () => {
    let variant = "secondary";
    if (post.status === "pending") variant = "warning";
    if (post.status === "accepted") variant = "primary";
    if (post.status === "collected") variant = "success";

    return <Badge bg={variant}>{post.status}</Badge>;
  };

  const handleChatClick = async () => {
    try {
      // Determine the other user ID based on role
      const otherUserId = role === "contributor" ? post.acceptedBy : post.contributorId;
      
      // Create or get existing chat
      const newChatId = await createChat(post.id, post.contributorId, otherUserId);
      setChatId(newChatId);
      setShowChatModal(true);
    } catch (error) {
      console.error("Error initiating chat:", error);
      alert("Failed to open chat. Please try again.");
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Waste Post Details {getStatusBadge()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {post.imageUrl && (
              <Col md={6} className="mb-3">
                <Image src={post.imageUrl} alt={post.wasteType} fluid className="rounded" />
              </Col>
            )}
            <Col md={post.imageUrl ? 6 : 12}>
              <h4>{post.wasteType}</h4>
              <p><strong>Quantity:</strong> {post.quantity} kg</p>
              <p><strong>Address:</strong> {post.address}</p>
              <p><strong>Available Date:</strong> {formatDate(post.availableDate)}</p>
              <p><strong>Available Time:</strong> {formatTime(post.availableFrom)} - {formatTime(post.availableTo)}</p>
              {post.sellForFree && <Badge bg="success">Free</Badge>}

              {post.status === "accepted" && acceptedUser && (
                <div className="mt-3 p-3 bg-light rounded">
                  <h5>Accepted By:</h5>
                  <p><strong>Name:</strong> {acceptedUser.name || "Not provided"}</p>
                  <p><strong>Email:</strong> {acceptedUser.email}</p>
                  <p><strong>Contact:</strong> {acceptedUser.contact || "Not provided"}</p>
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          {post.status === "accepted" && ((role === "contributor" && post.acceptedBy) || 
              (role === "volunteer" || role === "recycler")) && (
            <Button 
              variant={unreadCount > 0 ? "danger" : "outline-primary"} 
              onClick={handleChatClick}
            >
              <ChatDots className="me-2" /> 
              Chat
              {unreadCount > 0 && (
                <Badge bg="light" text="danger" pill className="ms-2">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          )}
          
          {post.status === "pending" && role === "contributor" && (
            <>
              <Button variant="outline-secondary" onClick={() => onEdit(post)}>
                Edit
              </Button>
              <Button variant="outline-danger" onClick={() => {
                if (window.confirm("Are you sure you want to delete this post?")) {
                  onDelete(post.id);
                }
              }}>
                Delete
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
      
      {showChatModal && (
        <ChatModal
          show={showChatModal}
          onHide={() => {
            setShowChatModal(false);
            // Reset unread count after viewing
            setUnreadCount(0);
          }}
          chatId={chatId}
          postId={post.id}
          otherUserId={role === "contributor" ? post.acceptedBy : post.contributorId}
        />
      )}
    </>
  );
};