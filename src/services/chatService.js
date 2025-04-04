// src/services/chatService.js
import { db } from "../firebaseConfig";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  getDocs,
  updateDoc, 
  serverTimestamp,
  writeBatch,
  limit 
} from "firebase/firestore";

// Create a new chat between a contributor and collector
export const createChat = async (postId, contributorId, collectorId) => {
  try {
    // Check if a chat already exists for this post and these users
    const existingChat = await getChatByPostAndUsers(postId, contributorId, collectorId);
    
    if (existingChat) {
      return existingChat.id; // Return existing chat ID
    }
    
    // Create a new chat
    const chatRef = await addDoc(collection(db, "chats"), {
      postId,
      contributorId,
      collectorId,
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: serverTimestamp(),
      unreadContributor: 0,
      unreadCollector: 0
    });
    
    return chatRef.id;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

// Get a chat by post ID and user IDs - simplified to avoid complex indexes
export const getChatByPostAndUsers = async (postId, contributorId, collectorId) => {
  try {
    // Simple query that doesn't require complex indexes
    const chatsQuery = query(
      collection(db, "chats"),
      where("postId", "==", postId)
    );
    
    const snapshot = await getDocs(chatsQuery);
    
    // Filter on client side to avoid complex indexes
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (
        (data.contributorId === contributorId && data.collectorId === collectorId) ||
        (data.contributorId === collectorId && data.collectorId === contributorId)
      ) {
        return { id: doc.id, ...data };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting chat:", error);
    throw error;
  }
};

// Get all chats for a user (either as contributor or collector)
export const getUserChats = async (userId) => {
  try {
    const chats = [];
    
    // Get chats where user is contributor
    const contributorChatsQuery = query(
      collection(db, "chats"),
      where("contributorId", "==", userId)
    );
    
    const contributorSnapshot = await getDocs(contributorChatsQuery);
    contributorSnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data(), userRole: "contributor" });
    });
    
    // Get chats where user is collector
    const collectorChatsQuery = query(
      collection(db, "chats"),
      where("collectorId", "==", userId)
    );
    
    const collectorSnapshot = await getDocs(collectorChatsQuery);
    collectorSnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data(), userRole: "collector" });
    });
    
    return chats;
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text, postId = null) => {
  try {
    // Get the chat to determine roles
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error("Chat not found");
    }
    
    const chatData = chatSnap.data();
    const isContributor = senderId === chatData.contributorId;
    
    // Create message
    const messageRef = await addDoc(collection(db, "messages"), {
      chatId,
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false,
      postId // Optional: reference to specific post if negotiating
    });
    
    // Update chat with last message
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      // Increment unread count for the recipient
      unreadContributor: isContributor ? chatData.unreadContributor : chatData.unreadContributor + 1,
      unreadCollector: isContributor ? chatData.unreadCollector + 1 : chatData.unreadCollector
    });
    
    return messageRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get all messages for a chat with fallback for missing indexes
export const getMessages = (chatId, callback, errorCallback) => {
  try {
    // Try with orderBy first (requires composite index)
    try {
      const messagesQuery = query(
        collection(db, "messages"),
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
      );
      
      return onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(messages);
        },
        (error) => {
          console.error("Error in ordered query:", error);
          
          // If index error, fall back to unordered query
          if (error.code === 'failed-precondition') {
            console.log("Missing index, using fallback query");
            
            // Use a simpler query that doesn't need an index
            const fallbackQuery = query(
              collection(db, "messages"),
              where("chatId", "==", chatId)
            );
            
            const fallbackUnsubscribe = onSnapshot(
              fallbackQuery,
              (fallbackSnapshot) => {
                // Sort messages by createdAt client-side
                const messages = fallbackSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                
                // Sort manually
                messages.sort((a, b) => {
                  if (!a.createdAt) return -1;
                  if (!b.createdAt) return 1;
                  
                  const timeA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                  const timeB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                  
                  return timeA - timeB;
                });
                
                callback(messages);
              },
              (fallbackError) => {
                console.error("Error in fallback query:", fallbackError);
                if (errorCallback) errorCallback(fallbackError);
              }
            );
            
            return fallbackUnsubscribe;
          }
          
          // Handle other errors
          if (errorCallback) errorCallback(error);
        }
      );
    } catch (setupError) {
      console.error("Error setting up ordered query:", setupError);
      throw setupError;
    }
  } catch (error) {
    console.error("Main try/catch in getMessages:", error);
    
    // Final fallback - one-time fetch without real-time updates
    getDocs(query(collection(db, "messages"), where("chatId", "==", chatId)))
      .then(snapshot => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          if (!a.createdAt) return -1;
          if (!b.createdAt) return 1;
          
          const timeA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const timeB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          
          return timeA - timeB;
        });
        
        callback(messages);
      })
      .catch(finalError => {
        console.error("Error in final fallback:", finalError);
        if (errorCallback) errorCallback(finalError);
        callback([]);
      });
    
    return () => {}; // Return empty unsubscribe function
  }
};

// Mark messages as read - simplified to avoid complex indexes
export const markMessagesAsRead = async (chatId, userId) => {
  try {
    // Get the chat to determine roles
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error("Chat not found");
    }
    
    const chatData = chatSnap.data();
    const isContributor = userId === chatData.contributorId;
    
    // Update chat document to reset unread counter for this user
    await updateDoc(chatRef, {
      unreadContributor: isContributor ? 0 : chatData.unreadContributor,
      unreadCollector: isContributor ? chatData.unreadCollector : 0
    });
    
    // Use simple query to get all unread messages for this chat
    const messagesQuery = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      where("read", "==", false)
    );
    
    const messagesSnapshot = await getDocs(messagesQuery);
    
    // Filter on client-side to avoid complex queries
    const messagesToUpdate = [];
    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.senderId !== userId) {
        messagesToUpdate.push(doc.ref);
      }
    });
    
    // Only update if we have messages to update
    if (messagesToUpdate.length > 0) {
      const batch = writeBatch(db);
      messagesToUpdate.forEach(docRef => {
        batch.update(docRef, { read: true });
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};
export const getTotalUnreadCount = async (userId) => {
    try {
      // Get chats where user is contributor
      const contributorChatsQuery = query(
        collection(db, "chats"),
        where("contributorId", "==", userId)
      );
      
      const contributorSnapshot = await getDocs(contributorChatsQuery);
      let unreadCount = 0;
      
      contributorSnapshot.forEach(doc => {
        const data = doc.data();
        unreadCount += data.unreadContributor || 0;
      });
      
      // Get chats where user is collector
      const collectorChatsQuery = query(
        collection(db, "chats"),
        where("collectorId", "==", userId)
      );
      
      const collectorSnapshot = await getDocs(collectorChatsQuery);
      
      collectorSnapshot.forEach(doc => {
        const data = doc.data();
        unreadCount += data.unreadCollector || 0;
      });
      
      return unreadCount;
    } catch (error) {
      console.error("Error getting total unread count:", error);
      return 0;
    }
  };

  // Add this function to your chatService.js file

export const getChatWithUnreadCount = async (postId, userId) => {
    try {
      // Get all chats for this post
      const chatsQuery = query(
        collection(db, "chats"),
        where("postId", "==", postId)
      );
      
      const snapshot = await getDocs(chatsQuery);
      
      // Find chats where this user is involved
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        if (data.contributorId === userId) {
          // User is contributor
          return {
            chatId: doc.id,
            unreadCount: data.unreadContributor || 0,
            otherUserId: data.collectorId
          };
        } else if (data.collectorId === userId) {
          // User is collector
          return {
            chatId: doc.id,
            unreadCount: data.unreadCollector || 0,
            otherUserId: data.contributorId
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting chat with unread count:", error);
      return null;
    }
  };