import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebaseconfig";
import { createUserProfile } from "./firestoreService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
export const signIn = async (email, password) => {
  try {
    console.log("🔐 Attempting to sign in user:", email);
    
    // Validate inputs
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    
    // Attempt sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ User signed in successfully:", {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    return userCredential;
  } catch (error) {
    console.error("❌ Sign in error:", {
      code: error.code,
      message: error.message,
      email: email
    });
    
    // Handle specific Firebase errors
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error("No account found with this email address");
      case 'auth/wrong-password':
        throw new Error("Incorrect password");
      case 'auth/invalid-email':
        throw new Error("Invalid email address");
      case 'auth/user-disabled':
        throw new Error("This account has been disabled");
      case 'auth/too-many-requests':
        throw new Error("Too many failed attempts. Please try again later");
      case 'auth/network-request-failed':
        throw new Error("Network error. Please check your connection");
      case 'auth/invalid-credential':
        throw new Error("Invalid email or password");
      default:
        throw new Error(error.message || "Login failed. Please try again");
    }
  }
};

// Sign out function for user logout
export const logOut = async () => {
  try {
    console.log("🚪 User logging out...");
    
    // Clear all stored authentication data
    await AsyncStorage.multiRemove([
      'auth_state',
      'profile_data', 
      'session_timestamp'
    ]);
    
    console.log("🧹 Cleared stored authentication data");
    
    // Sign out from Firebase
    await signOut(auth);
    
    console.log("✅ User logged out successfully");
  } catch (error) {
    console.error("❌ Error during logout:", error);
    throw error;
  }
};

// Function to validate current session
export const validateSession = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log("❌ No authenticated user found");
      return false;
    }

    // Check if token is still valid
    const token = await user.getIdToken(true); // Force refresh
    if (token) {
      console.log("✅ Session is valid");
      return true;
    } else {
      console.log("❌ Session token is invalid");
      return false;
    }
  } catch (error) {
    console.error("❌ Error validating session:", error);
    return false;
  }
};

// Function to refresh user token
export const refreshUserToken = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      console.log("🔄 Token refreshed successfully");
      return token;
    }
    return null;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    throw error;
  }
};

// Listener for authentication state changes
export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, callback);
};
