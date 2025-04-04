
// src/components/Common/ChatsTab.jsx
import React, { useState, useEffect } from 'react';
import { ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { getUserChats } from '../../services/chatService';
import { getUserById } from '../../services/authService';
import { getWastePostById } from '../../services/wasteService';
import { useAuth } from '../../context/AuthContext';
import ChatModal from './ChatModal';

const ChatsTab = () => {
  const { userId, role } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const chatsData = await getUserChats(userId);
        
        // Fetch user details and post details for each chat
        const enrichedChats = await Promise.all(
          chatsData.map(async (chat) => {
            const otherUserId = chat.userRole === 'contributor' 
              ? chat.collectorId 
              : chat.contributorId;
            
            try {
              const userData = await getUserById(otherUserId);
              const postData = await getWastePostById(chat.postId);
              
              // Set the appropriate unread count based on user role
              const unreadCount = chat.userRole === 'contributor' 
                ? chat.unreadContributor 
                : chat.unreadCollector;
              
              return {
                ...chat,
                otherUser: userData,
                post: postData,
                unreadCount: unreadCount || 0
              };
            } catch (error) {
              console.error("Error enriching chat:", error);
              return {
                ...chat,
                otherUser: { name: 'Unknown User' },
                post: { wasteType: 'Unknown' },
                unreadCount: 0
              };
            }
          })
        );
        
        // Sort chats by last message time and unread status (unread first)
        const sortedChats = enrichedChats.sort((a, b) => {
          // Sort unread chats first
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
          
          // Then sort by last message time
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
        });
        
        setChats(sortedChats);
        setLoading(false);
        setError('');
      } catch (error) {
        console.error("Error fetching chats:", error);
        setLoading(false);
        setError('Failed to load chats. Please try again later.');
      }
    };
    
    if (userId) {
      fetchChats();
      
      // Set up a refresh interval (optional)
      const interval = setInterval(() => {
        fetchChats();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [userId]);
  
  const handleOpenChat = (chat) => {
    setSelectedChat(chat);
    setShowChatModal(true);
  };
  
  const handleCloseChatModal = () => {
    setShowChatModal(false);
    // Refresh the chats list to update unread counts
    setTimeout(() => {
      const fetchChats = async () => {
        try {
          const chatsData = await getUserChats(userId);
          
          // Similar enrichment process as above...
          const enrichedChats = await Promise.all(
            chatsData.map(async (chat) => {
              const otherUserId = chat.userRole === 'contributor' 
                ? chat.collectorId 
                : chat.contributorId;
              
              try {
                const userData = await getUserById(otherUserId);
                const postData = await getWastePostById(chat.postId);
                
                const unreadCount = chat.userRole === 'contributor' 
                  ? chat.unreadContributor 
                  : chat.unreadCollector;
                
                return {
                  ...chat,
                  otherUser: userData,
                  post: postData,
                  unreadCount: unreadCount || 0
                };
              } catch (error) {
                console.error("Error enriching chat:", error);
                return {
                  ...chat,
                  otherUser: { name: 'Unknown User' },
                  post: { wasteType: 'Unknown' },
                  unreadCount: 0
                };
              }
            })
          );
          
          // Sort chats by last message time and unread status
          const sortedChats = enrichedChats.sort((a, b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            if (!a.lastMessageTime || !b.lastMessageTime) return 0;
            return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
          });
          
          setChats(sortedChats);
        } catch (error) {
          console.error("Error refreshing chats:", error);
        }
      };
      
      fetchChats();
    }, 1000);
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="chat-list-container">
      <h3 className="mb-3">My Conversations</h3>
      
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : chats.length === 0 ? (
        <Alert variant="info">
          You don't have any conversations yet. When you chat with someone about a waste post, it will appear here.
        </Alert>
      ) : (
        <ListGroup>
          {chats.map((chat) => (
            <ListGroup.Item 
              key={chat.id}
              action
              onClick={() => handleOpenChat(chat)}
              className={`d-flex justify-content-between align-items-center ${chat.unreadCount > 0 ? 'border-start border-danger border-4' : ''}`}
              style={chat.unreadCount > 0 ? { backgroundColor: 'rgba(255, 220, 220, 0.2)' } : {}}
            >
              <div>
                <div className="d-flex align-items-center">
                  <strong>{chat.otherUser?.name || chat.otherUser?.email || 'Unknown User'}</strong>
                  {chat.unreadCount > 0 && (
                    <Badge bg="danger" pill className="ms-2">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="text-muted small">
                  Re: {chat.post?.wasteType || 'Unknown'} ({chat.post?.quantity || '?'} kg)
                </div>
                <div className="text-truncate" style={{ maxWidth: '250px' }}>
                  {chat.lastMessage || 'No messages yet'}
                </div>
              </div>
              <small className="text-muted ms-2 text-nowrap">
                {formatTime(chat.lastMessageTime)}
              </small>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      
      {selectedChat && (
        <ChatModal
          show={showChatModal}
          onHide={handleCloseChatModal}
          chatId={selectedChat.id}
          postId={selectedChat.postId}
          otherUserId={selectedChat.userRole === 'contributor' 
            ? selectedChat.collectorId 
            : selectedChat.contributorId}
        />
      )}
    </div>
  );
};

export default ChatsTab;