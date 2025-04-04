// src/services/wasteService.js
import { db, app } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  GeoPoint,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 🔹 Create a new waste post. 
// Make sure the passed wasteData includes all necessary fields such as contributorId,
// contributorEmail, wasteType, quantity, etc.
export const addWastePost = async (wasteData) => {
  try {
    const refCol = collection(db, "waste_posts");
    const docRef = await addDoc(refCol, {
      ...wasteData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...wasteData };
  } catch (error) {
    console.error("Error adding waste post:", error);
    throw error;
  }
};

// 🔹 Get pending or accepted waste posts.
export const getPendingOrAcceptedPosts = async () => {
  try {
    const refCol = collection(db, "waste_posts");
    const snapshot = await getDocs(refCol);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching pending/accepted posts:", error);
    throw error;
  }
};

// 🔹 Fetch waste posts by user (for contributors).
export const fetchWastePostsByUser = async (userId) => {
  try {
    const q = query(collection(db, "waste_posts"), where("contributorId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching waste posts:", error);
    return [];
  }
};

// 🔹 Get contributor's waste posts.
export const getContributorWastePosts = async (contributorId) => {
  try {
    const refCol = collection(db, "waste_posts");
    const q = query(refCol, where("contributorId", "==", contributorId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("No waste posts found for this contributor.");
      return [];
    }
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching contributor waste posts:", error);
    return [];
  }
};

// 🔹 Get all pending waste posts.
export const getPendingWastePosts = async () => {
  try {
    const refCol = collection(db, "waste_posts");
    const q = query(refCol, where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching pending waste posts:", error);
    throw error;
  }
};

// 🔹 Accept or cancel acceptance.
// newStatus can be "accepted" or "pending".
// If accepted, set acceptedBy to userId; if canceled, set acceptedBy to null.
export const acceptWasteRequest = async (postId, userId, newStatus) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    await updateDoc(postRef, {
      status: newStatus,
      acceptedBy: newStatus === "accepted" ? userId : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating waste post status:", error);
    throw error;
  }
};

// 🔹 Get accepted waste posts (for recyclers).
export const getAcceptedWastePosts = async () => {
  try {
    const refCol = collection(db, "waste_posts");
    const q = query(refCol, where("status", "==", "accepted"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching accepted waste posts:", error);
    throw error;
  }
};

// 🔹 Mark waste as collected.
export const markWasteAsCollected = async (postId) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    await updateDoc(postRef, { status: "collected", updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error marking waste as collected:", error);
    throw error;
  }
};

// 🔹 Revert status back to accepted.
export const revertToAccepted = async (postId, userId) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    await updateDoc(postRef, { status: "accepted", acceptedBy: userId, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error reverting waste post status:", error);
    throw error;
  }
};

// 🔹 Upload image.
export const uploadImage = async (file) => {
  try {
    const storage = getStorage(app);
    const fileRef = ref(storage, `post_images/${file.name}-${Date.now()}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// 🔹 Update waste post.
// Make sure the updatedData includes contributorEmail if needed.
export const updateWastePost = async (postId, updatedData) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    await updateDoc(postRef, { ...updatedData, updatedAt: serverTimestamp() });
    return { id: postId, ...updatedData };
  } catch (error) {
    console.error("Error updating waste post:", error);
    throw error;
  }
};

// 🔹 Delete waste post.
export const deleteWastePost = async (postId) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting waste post:", error);
    throw error;
  }
};

/* 🔹 Add Volunteer from Bulk Upload */
export const addVolunteerFromBulkUpload = async (volunteerData) => {
  try {
    const volunteerRef = collection(db, "users");
    const volunteerDoc = {
      name: volunteerData.name,
      email: volunteerData.email,
      role: "volunteer",
      address: volunteerData.address || "",
      contact: volunteerData.contact || "",
      location: volunteerData.location
        ? new GeoPoint(volunteerData.location.lat, volunteerData.location.lng)
        : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(volunteerRef, volunteerDoc);
    return { id: docRef.id, ...volunteerDoc };
  } catch (error) {
    console.error("Error adding volunteer:", error);
    throw error;
  }
};

// 🔹 Get All Volunteers.
export const getAllVolunteers = async () => {
  try {
    const refCol = collection(db, "users");
    const q = query(refCol, where("role", "==", "volunteer"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    throw error;
  }
};

// 🔹 Get total waste collected by NGO (by summing waste from volunteers)
export const getTotalWasteCollectedByNGO = async (ngoId) => {
  try {
    if (!ngoId) {
      console.error("Error: NGO ID is undefined or null");
      return 0;
    }
    // Fetch volunteers for the given NGO
    const volunteersRef = collection(db, "users");
    const volunteerQuery = query(
      volunteersRef,
      where("ngoId", "==", ngoId),
      where("role", "==", "volunteer")
    );
    const volunteerSnapshot = await getDocs(volunteerQuery);
    const volunteerIds = volunteerSnapshot.docs.map((doc) => doc.id);
    if (volunteerIds.length === 0) {
      console.warn(`No volunteers found for NGO ID: ${ngoId}`);
      return 0;
    }
    // Fetch waste posts marked as collected by these volunteers
    const wasteRef = collection(db, "waste_posts");
    const wasteQuery = query(
      wasteRef,
      where("acceptedBy", "in", volunteerIds),
      where("status", "==", "collected")
    );
    const wasteSnapshot = await getDocs(wasteQuery);
    if (wasteSnapshot.empty) {
      console.warn(`No collected waste records for NGO ID: ${ngoId}`);
      return 0;
    }
    let totalWaste = 0;
    wasteSnapshot.forEach((doc) => {
      const data = doc.data();
      const quantityNumber = parseFloat(data.quantity) || 0;
      totalWaste += quantityNumber;
    });
    console.log(`Total waste collected by NGO (${ngoId}): ${totalWaste} kg`);
    return totalWaste;
  } catch (error) {
    console.error("Error fetching waste collection data:", error);
    return 0;
  }
};

export const getVolunteerStats = async (volunteerId) => {
  try {
    const wasteRef = collection(db, "waste_posts");
    // Query for posts accepted by this volunteer with status "accepted" or "collected"
    const q = query(
      wasteRef,
      where("acceptedBy", "==", volunteerId),
      where("status", "in", [ "collected"])
    );
    const snapshot = await getDocs(q);
    let totalWasteCollected = 0;
    let totalPosts = snapshot.docs.length;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const quantity = parseFloat(data.quantity) || 0;
      totalWasteCollected += quantity;
    });
    return { totalWasteCollected, totalPosts };
  } catch (err) {
    console.error("Error calculating volunteer stats:", err);
    return { totalWasteCollected: 0, totalPosts: 0 };
  }
};


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
// Add a method to get waste post details by ID (if not already there)
export const getWastePostById = async (postId) => {
  try {
    const postRef = doc(db, "waste_posts", postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting waste post:", error);
    throw error;
  }
};
export const initiateChat = async (postId, contributorId, collectorId) => {
  return createChat(postId, contributorId, collectorId);
};


// Function to calculate environmental impact
export const calculateEnvironmentalImpact = (totalWaste) => {
  // Assumptions based on research:
  // 1. Each kg of waste recycled saves approximately 2.5 kg of CO2
  // 2. An average tree absorbs ~22 kg of CO2 per year
  const carbonReduced = totalWaste * 2.5;
  const treesEquivalent = carbonReduced / 22;

  return {
    carbonReduced,
    treesEquivalent
  };
};

// Function to get volunteer waste impact
export const getVolunteerWasteImpact = async (ngoId) => {
  try {
    // Count volunteers
    const volunteersRef = collection(db, "users");
    const volunteerQuery = query(
      volunteersRef,
      where("ngoId", "==", ngoId),
      where("role", "==", "volunteer")
    );
    
    const volunteerSnapshot = await getCountFromServer(volunteerQuery);
    const volunteerCount = volunteerSnapshot.data().count;

    // Estimate average waste per volunteer (hypothetical calculation)
    const averageWastePerVolunteer = 50; // kg per volunteer
    
    return volunteerCount * averageWastePerVolunteer;
  } catch (error) {
    console.error("Error calculating volunteer impact:", error);
    return 0;
  }
};

// Additional utility functions can be added here
export const getWasteBreakdown = async (ngoId) => {
  try {
    const wasteRef = collection(db, "wasteCollections");
    const q = query(wasteRef, where("ngoId", "==", ngoId));
    
    const snapshot = await getDocs(q);
    
    // Group waste by type
    const wasteBreakdown = {};
    snapshot.forEach(doc => {
      const wasteType = doc.data().type;
      const weight = doc.data().weight;
      
      wasteBreakdown[wasteType] = (wasteBreakdown[wasteType] || 0) + weight;
    });

    return wasteBreakdown;
  } catch (error) {
    console.error("Error getting waste breakdown:", error);
    return {};
  }
};