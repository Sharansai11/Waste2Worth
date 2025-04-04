import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const getRecyclers = async () => {
  const ref = collection(db, "recyclers");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};