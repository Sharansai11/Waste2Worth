// src/components/Common/ChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { getUserById } from '../../services/authService';
import { getWastePostById } from '../../services/wasteService';
import { getMessages, sendMessage, markMessagesAsRead } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Send, Trash } from 'react-bootstrap-icons';

const ChatModal = ({ show, onHide, chatId, postId, otherUserId }) => {
  const { userId, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [post, setPost] = useState(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch other user's details
        if (otherUserId) {
          const userData = await getUserById(otherUserId);
          setOtherUser(userData);
        }
        
        // Fetch post details
        if (postId) {
          const postData = await getWastePostById(postId);
          setPost(postData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [otherUserId, postId]);
  
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (chatId) {
      setLoadingMessages(true);
      
      try {
        // Subscribe to real-time messages with error callback
        unsubscribe = getMessages(
          chatId, 
          (msgs) => {
            setMessages(msgs);
            setLoadingMessages(false);
            scrollToBottom();
          },
          (error) => {
            console.error("Error in messages listener:", error);
            setMessageError("Could not load messages. Please try again.");
            setLoadingMessages(false);
          }
        );
        
        // Mark messages as read when opening the chat
        markMessagesAsRead(chatId, userId).catch(err => {
          console.error("Error marking messages as read:", err);
        });
      } catch (error) {
        console.error("Error setting up messages listener:", error);
        setMessageError("Failed to connect to chat service.");
        setLoadingMessages(false);
      }
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chatId, userId]);
  
  useEffect(() => {
    // Mark messages as read whenever the modal is shown
    if (show && chatId) {
      markMessagesAsRead(chatId, userId).catch(err => {
        console.error("Error marking messages as read:", err);
      });
    }
  }, [show, chatId, userId]);
  
  const scrollToBottom = () => {
    // Use setTimeout to ensure rendering is complete
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Create a temporary message with pending status
    const tempMessage = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: userId,
      text: newMessage,
      createdAt: new Date(),
      pending: true
    };
    
    // Add to local messages immediately for instant feedback
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Clear input field right away
    const messageToSend = newMessage;
    setNewMessage('');
    
    // Scroll to the new message
    scrollToBottom();
    
    try {
      // Actually send the message
      await sendMessage(chatId, userId, messageToSend, postId);
      // The real message will be added by the listener when it comes back from the server
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove the temporary message
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempMessage.id)
      );
      
      // Show error and restore the message to the input
      setMessageError("Failed to send message");
      setNewMessage(messageToSend);
    }
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let date;
      
      if (timestamp.toDate) {
        // Firestore timestamp
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        // JavaScript Date object
        date = timestamp;
      } else {
        // Try to parse as string/number
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      console.error("Error formatting time:", err);
      return '';
    }
  };
  
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {loading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <>
              Chat with {otherUser?.name || otherUser?.email || 'User'}
              {post && (
                <Badge bg="secondary" className="ms-2">
                  Re: {post.wasteType} ({post.quantity} kg)
                </Badge>
              )}
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {loading ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <>
            <div 
              className="chat-messages p-3" 
              style={{ 
                height: '400px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {loadingMessages ? (
                <div className="text-center p-5 my-auto">
                  <Spinner animation="border" size="sm" />
                  <p className="text-muted mt-2">Loading messages...</p>
                </div>
              ) : messageError ? (
                <div className="text-center p-5 my-auto">
                  <Alert variant="danger">
                    {messageError}
                  </Alert>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      setLoadingMessages(true);
                      setMessageError(null);
                      // Re-initialize the messages listener
                      const unsub = getMessages(
                        chatId, 
                        (msgs) => {
                          setMessages(msgs);
                          setLoadingMessages(false);
                          scrollToBottom();
                        },
                        (err) => {
                          setMessageError("Still having trouble loading messages.");
                          setLoadingMessages(false);
                        }
                      );
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted my-auto">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-2 ${message.senderId === userId ? 'text-end' : ''}`}
                  >
                    <div
                      className={`d-inline-block p-2 rounded ${
                        message.senderId === userId
                          ? message.pending ? 'bg-secondary text-white' : 'bg-primary text-white'
                          : 'bg-light'
                      }`}
                      style={{ maxWidth: '75%', textAlign: 'left' }}
                    >
                      {message.text}
                      <div className="text-end">
                        <small 
                          className={message.senderId === userId ? 'text-white-50' : 'text-muted'}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {message.pending ? 'Sending...' : formatTime(message.createdAt)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <Form onSubmit={handleSendMessage} className="border-top p-2">
              {messageError && (
                <Alert variant="danger" className="py-1 px-2 mb-2">
                  <small>{messageError}</small>
                </Alert>
              )}
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="me-2"
                  disabled={loadingMessages}
                />
                <Button 
                  type="submit" 
                  variant="success" 
                  disabled={loadingMessages || !newMessage.trim()}
                >
                  <Send />
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ChatModal;