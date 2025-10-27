// Authentication Persistence Test
// This file can be used to test authentication persistence

import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseconfig";

export const testAuthPersistence = async () => {
  try {
    console.log("🧪 Testing authentication persistence...");
    
    // Check current auth state
    const currentUser = auth.currentUser;
    console.log("Current user:", currentUser ? `User ${currentUser.uid}` : "No user");
    
    // Check stored auth data
    const [authState, profileData, sessionTimestamp] = await AsyncStorage.multiGet([
      'auth_state',
      'profile_data',
      'session_timestamp',
    ]);
    
    console.log("Stored auth state:", authState[1] ? "Found" : "Not found");
    console.log("Stored profile data:", profileData[1] ? "Found" : "Not found");
    console.log("Session timestamp:", sessionTimestamp[1] ? "Found" : "Not found");
    
    if (sessionTimestamp[1]) {
      const timestamp = parseInt(sessionTimestamp[1]);
      const now = Date.now();
      const ageInHours = (now - timestamp) / (1000 * 60 * 60);
      console.log(`Session age: ${ageInHours.toFixed(2)} hours`);
    }
    
    return {
      currentUser: !!currentUser,
      hasStoredAuth: !!authState[1],
      hasStoredProfile: !!profileData[1],
      hasSessionTimestamp: !!sessionTimestamp[1],
    };
  } catch (error) {
    console.error("Error testing auth persistence:", error);
    return null;
  }
};

export const clearAllAuthData = async () => {
  try {
    console.log("🧹 Clearing all authentication data...");
    await AsyncStorage.multiRemove([
      'auth_state',
      'profile_data',
      'session_timestamp',
    ]);
    console.log("✅ All auth data cleared");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

