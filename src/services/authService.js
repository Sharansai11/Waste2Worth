import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { app, db } from "../firebaseConfig"; 
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";

const auth = getAuth(app);

// ✅ Fetch and Assign User Role
const fetchAndCacheUserRole = async (uid, setRole, setNgoName) => {
  const userDocRef = doc(db, "users", uid);
  const snapshot = await getDoc(userDocRef);

  if (snapshot.exists()) {
    const userData = snapshot.data();
    console.log("Fetched user data:", userData); // ✅ Debugging role

    setRole(userData.role);

    if (userData.role === "ngo" && userData.name) {
      setNgoName(userData.name);
      console.log("Setting NGO Name:", userData.name); // ✅ Debugging NGO name
    } else {
      setNgoName(null);
    }

    return userData.role;
  } else {
    throw new Error("User data not found.");
  }
};

// ✅ Login User
const loginUser = async (email, password, setUser, setRole, setNgoName) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;

  const role = await fetchAndCacheUserRole(user.uid, setRole, setNgoName);
  setUser(user);

  return { user, role };
};

// ✅ Get User By ID
export const getUserById = async (userId) => {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const registerUser = async (email, password, role, fullName, extraData, setUser, setRole, setNgoName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const userId = result.user.uid;

  console.log(`✅ New User Registered: ${fullName} (Role: ${role})`);

  // ✅ Ensure extraData exists
  if (!extraData) extraData = {};

  // ✅ Default User Data
  const userDoc = {
    name: fullName,
    email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // ✅ Store Contact for Contributors
  if (role === "contributor") {
    userDoc.contact = extraData.contact || ""; // Ensure contact is stored
    console.log("Contributor Contact:", extraData.contact);
  }

  // ✅ Store Additional Data for Volunteers, Recyclers, and NGOs
  if (role === "volunteer" || role === "recycler" || role === "ngo") {
    userDoc.address = extraData.address || "";
    userDoc.contact = extraData.contact || "";

    if (extraData.location) {
      const { lat, lng } = extraData.location;
      userDoc.location = new GeoPoint(lat, lng);
    }

    if (role === "volunteer") {
      userDoc.isFromNGO = extraData.volunteerType === "ngo";
      if (userDoc.isFromNGO) {
        userDoc.ngoName = extraData.ngoName || "";
      }
    }
  }

  // ✅ Save User Data to Firestore
  await setDoc(doc(db, "users", userId), userDoc);
  console.log("✅ User Data Stored in Firestore:", userDoc);

  // ✅ Update Context State
  setUser(result.user);
  setRole(role);

  if (role === "ngo") {
    console.log("Setting NGO Name:", fullName);
    setNgoName(fullName);
  }

  return result.user;
};

// ✅ Bulk Register Volunteers (For NGOs) with NGO session restoration
export const bulkRegisterVolunteers = async (volunteers, ngoId, ngoName, ngoEmail, ngoPassword) => {
  const registeredVolunteers = [];
  if (!ngoId || !ngoName) {
    throw new Error("NGO details not found. Please log in again.");
  }
  try {
    for (const volunteer of volunteers) {
      try {
        if (!volunteer.password) {
          throw new Error(`Password is missing for ${volunteer.email}.`);
        }
        // Create volunteer with provided password
        const result = await createUserWithEmailAndPassword(auth, volunteer.email, volunteer.password);
        const userId = result.user.uid;
        const userDoc = {
          name: volunteer.name,
          email: volunteer.email,
          role: "volunteer",
          isFromNGO: true,
          ngoName,
          ngoId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          address: volunteer.address || "",
          contact: volunteer.contact || "",
        };
        if (volunteer.lat && volunteer.lng) {
          userDoc.location = new GeoPoint(parseFloat(volunteer.lat), parseFloat(volunteer.lng));
        }
        await setDoc(doc(db, "users", userId), userDoc);
        registeredVolunteers.push({ name: volunteer.name, email: volunteer.email });
        // Restore NGO session after each volunteer creation
        await signInWithEmailAndPassword(auth, ngoEmail, ngoPassword);
      } catch (error) {
        console.error(`Error registering ${volunteer.email}:`, error.message);
      }
    }
    console.log("✅ Volunteers registered successfully");
  } catch (error) {
    console.error("❌ Bulk Registration Error:", error);
  }
  return registeredVolunteers;
};

// Retrieve User Role
export const getUserRole = async (uid) => {
  const userDocRef = doc(db, "users", uid);
  const snapshot = await getDoc(userDocRef);
  
  if (snapshot.exists()) {
    return snapshot.data().role;
  } else {
    throw new Error("User data not found.");
  }
};

export const getContributorEmail = async (contributorId) => {
  try {
    // Reference to the contributor document in the "users" collection
    const userDocRef = doc(db, "users", contributorId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      // Expecting that the contributor document has an "email" field
      return userDoc.data().email;
    } else {
      console.error("No contributor found for id:", contributorId);
      return null;
    }
  } catch (error) {
    console.error("Error fetching contributor email:", error);
    return null;
  }
};

// ✅ Logout User
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// ✅ Forgot Password
const resetPassword = async (email) => {
  if (!email) throw new Error("Email is required to reset password.");
  await sendPasswordResetEmail(auth, email);
};

export const deleteVolunteer = async (volunteerId) => {
  if (!volunteerId) throw new Error("Volunteer ID is required.");
  await deleteDoc(doc(db, "users", volunteerId));
  console.log(`✅ Volunteer with ID ${volunteerId} deleted successfully.`);
};

export const sendOtp = async (recipientEmail, otp) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5174"}/send-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail, otp }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send OTP email");
    }
    console.log("OTP email sent successfully");
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

export { auth, loginUser, resetPassword };