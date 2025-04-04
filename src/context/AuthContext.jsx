import { createContext, useContext, useState, useEffect } from "react";
import { auth, loginUser, logoutUser, registerUser, resetPassword } from "../services/authService";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState(null);
  const [role, setRole] = useState(null);
  const [name, setName] = useState(null);
  const [contact, setContact] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Clear all user-related states when no user is logged in
        setUser(null);
        setUserId(null);
        setEmail(null);
        setRole(null);
        setName(null);
        setContact(null);
        setAddress(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setUserId(currentUser.uid);
      setEmail(currentUser.email);
      setLoading(true);

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(userDocRef);

        if (snapshot.exists()) {
          const userData = snapshot.data();
          
          // Set common user details
          setRole(userData.role);
          setName(userData.name || null);
          setContact(userData.contact || null);
          setAddress(userData.address || null);

          // Additional role-specific handling if needed
          if (userData.role === "ngo") {
            // Specific handling for NGO users
          } else if (userData.role === "recycler") {
            // Specific handling for recycler users
          }
        } else {
          console.error("User document not found in Firestore.");
          // Reset all states if no document found
          setRole(null);
          setName(null);
          setContact(null);
          setAddress(null);
        }
      } catch (error) {
        console.error("❌ Error fetching user details:", error);
        // Reset states on error
        setRole(null);
        setName(null);
        setContact(null);
        setAddress(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { user, role } = await loginUser(email, password, setUser, setRole, setName);
    setUserId(user?.uid || null);
    setEmail(user?.email || null);
    return { user, role };
  };

  const register = async (email, password, role, fullName, extraData) => {
    const registeredUser = await registerUser(
      email, 
      password, 
      role, 
      fullName, 
      extraData, 
      setUser, 
      setRole, 
      setName
    );
    setUserId(registeredUser?.uid || null);
    setEmail(registeredUser?.email || null);
    return registeredUser;
  };

  const logout = async () => {
    await logoutUser();
    // Reset all user-related states
    setUser(null);
    setUserId(null);
    setEmail(null);
    setRole(null);
    setName(null);
    setContact(null);
    setAddress(null);
  };

  const resetUserPassword = async (email) => {
    await resetPassword(email);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userId, 
        email, 
        role, 
        name, 
        contact, 
        address,
        login, 
        register, 
        logout, 
        resetUserPassword, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);