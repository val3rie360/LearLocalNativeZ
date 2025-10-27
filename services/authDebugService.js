import { auth } from "../firebaseconfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

// Debug utility to check user authentication status
export const debugAuthStatus = async () => {
  try {
    console.log("🔍 Debugging authentication status...");
    
    const currentUser = auth.currentUser;
    console.log("Current user:", currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName,
      providerId: currentUser.providerId
    } : "No user");
    
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        console.log("ID Token available:", !!token);
      } catch (tokenError) {
        console.error("Token error:", tokenError);
      }
    }
    
    return currentUser;
  } catch (error) {
    console.error("❌ Error debugging auth status:", error);
    return null;
  }
};

// Debug utility to check if user exists in Firestore
export const debugUserInFirestore = async (email) => {
  try {
    console.log("🔍 Checking if user exists in Firestore:", email);
    
    // Check in profiles collection
    const profileRef = doc(db, "profiles", email);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profileData = profileSnap.data();
      console.log("✅ User found in profiles:", {
        email: profileData.email,
        role: profileData.role,
        name: profileData.name,
        createdAt: profileData.createdAt
      });
      return { exists: true, collection: "profiles", data: profileData };
    }
    
    // If not found in profiles, check if it's a UID-based document
    console.log("❌ User not found in profiles collection");
    return { exists: false, collection: "profiles" };
    
  } catch (error) {
    console.error("❌ Error checking user in Firestore:", error);
    return { exists: false, error: error.message };
  }
};

// Debug utility to test Firebase connection
export const debugFirebaseConnection = async () => {
  try {
    console.log("🔍 Testing Firebase connection...");
    
    // Test Firestore connection
    const testRef = doc(db, "test", "connection");
    console.log("✅ Firestore connection: OK");
    
    // Test Auth connection
    console.log("✅ Auth connection: OK");
    console.log("Auth domain:", auth.app.options.authDomain);
    console.log("Project ID:", auth.app.options.projectId);
    
    return true;
  } catch (error) {
    console.error("❌ Firebase connection error:", error);
    return false;
  }
};

// Comprehensive login debug function
export const debugLoginIssue = async (email, password) => {
  try {
    console.log("🔍 Starting comprehensive login debug...");
    
    // 1. Check Firebase connection
    const connectionOk = await debugFirebaseConnection();
    if (!connectionOk) {
      return { success: false, issue: "Firebase connection failed" };
    }
    
    // 2. Check if user exists in Firestore
    const userInFirestore = await debugUserInFirestore(email);
    console.log("User in Firestore:", userInFirestore);
    
    // 3. Check current auth status
    const currentUser = await debugAuthStatus();
    
    // 4. Test sign in attempt
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Sign in test successful:", userCredential.user.uid);
      
      return {
        success: true,
        user: userCredential.user,
        firestoreData: userInFirestore
      };
    } catch (signInError) {
      console.error("❌ Sign in test failed:", signInError);
      return {
        success: false,
        issue: "Sign in failed",
        error: signInError,
        firestoreData: userInFirestore
      };
    }
    
  } catch (error) {
    console.error("❌ Debug login issue error:", error);
    return { success: false, issue: "Debug failed", error: error.message };
  }
};

// Utility to clear all auth data (for testing)
export const clearAllAuthData = async () => {
  try {
    console.log("🧹 Clearing all authentication data...");
    
    // Sign out current user
    if (auth.currentUser) {
      await auth.signOut();
    }
    
    // Clear AsyncStorage
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.default.multiRemove([
      'auth_state',
      'profile_data',
      'session_timestamp'
    ]);
    
    console.log("✅ All auth data cleared");
    return true;
  } catch (error) {
    console.error("❌ Error clearing auth data:", error);
    return false;
  }
};
