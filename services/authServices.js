import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebaseconfig";
import { createUserProfile } from "./firestoreService";

// Sign up function for user registration
export const signUp = async (email, password, role, extrData = {}) => {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const { name, verificationFile, ...restExtra } = extrData || {};

    // Prefer Cloudinary URLs coming from the upload flow
    const verificationFileUrl =
      verificationFile?.cloudinarySecureUrl ||
      verificationFile?.cloudinaryUrl ||
      verificationFile?.url ||
      null;

    const profileData = {
      email: user.email,
      role,
      name: name || null,
      createdAt: new Date(),
      verificationFileUrl,
      ...(verificationFile ? { verificationFile } : {}),
      ...restExtra,
    };

    await createUserProfile(user.uid, profileData);

    return user;
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};

// Sign in function for user login
export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign out function for user logout
export const logOut = () => {
  return signOut(auth);
};

// Listener for authentication state changes
export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};
