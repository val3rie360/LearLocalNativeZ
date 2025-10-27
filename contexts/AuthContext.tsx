import { User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authStateListener } from "../services/authServices";
import { getUserProfile } from "../services/firestoreService";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ProfileData {
  name?: string;
  email?: string;
  role?: "student" | "organization" | "admin";
  createdAt?: {
    seconds: number;
  };
  verificationFileUrl?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  updatedAt?: Date;
  bookmarkedResources?: string[];
  downloadedResources?: string[];
  registeredOpportunities?: Array<{
    opportunityId: string;
    specificCollection: string;
    registeredAt: any;
  }>;
  deadlineSnapshots?: Record<string, any>;
  deadlineNotifications?: Array<{
    id: string;
    type: string;
    opportunityId: string;
    opportunityTitle: string;
    category: string;
    changes: Array<any>;
    read: boolean;
    createdAt: any;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profileData: ProfileData | null;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  sessionValid: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileData: null,
  profileLoading: true,
  refreshProfile: async () => {},
  isAuthenticated: false,
  sessionValid: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  // Constants for AsyncStorage keys
  const AUTH_STATE_KEY = 'auth_state';
  const PROFILE_DATA_KEY = 'profile_data';
  const SESSION_TIMESTAMP_KEY = 'session_timestamp';

  // Function to save authentication state to AsyncStorage
  const saveAuthState = async (user: User | null, profile: ProfileData | null) => {
    try {
      if (user) {
        await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        }));
        await AsyncStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
        
        if (profile) {
          await AsyncStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profile));
        }
      } else {
        // Clear stored data when user logs out
        await AsyncStorage.multiRemove([AUTH_STATE_KEY, PROFILE_DATA_KEY, SESSION_TIMESTAMP_KEY]);
      }
    } catch (error) {
      console.error("Error saving auth state:", error);
    }
  };

  // Function to load authentication state from AsyncStorage
  const loadAuthState = async () => {
    try {
      const [authState, profileData, sessionTimestamp] = await AsyncStorage.multiGet([
        AUTH_STATE_KEY,
        PROFILE_DATA_KEY,
        SESSION_TIMESTAMP_KEY,
      ]);

      if (authState[1] && sessionTimestamp[1]) {
        const authData = JSON.parse(authState[1]);
        const timestamp = parseInt(sessionTimestamp[1]);
        const now = Date.now();
        
        // Check if session is still valid (within 30 days)
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        if (now - timestamp < thirtyDaysInMs) {
          console.log("🔄 Restoring authentication state from storage");
          
          if (profileData[1]) {
            const profile = JSON.parse(profileData[1]);
            setProfileData(profile);
            setSessionValid(true);
          }
          
          return authData;
        } else {
          console.log("⏰ Session expired, clearing stored auth data");
          await AsyncStorage.multiRemove([AUTH_STATE_KEY, PROFILE_DATA_KEY, SESSION_TIMESTAMP_KEY]);
        }
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
    }
    return null;
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user?.uid) {
      try {
        setProfileLoading(true);
        const profile = await getUserProfile(user.uid);
        setProfileData(profile);
        
        // Save profile data to storage
        await saveAuthState(user, profile);
        setSessionValid(true);
      } catch (error) {
        console.error("Error refreshing profile data:", error);
        setSessionValid(false);
      } finally {
        setProfileLoading(false);
      }
    }
  };

  // Fetch profile data when user changes
  useEffect(() => {
    if (user?.uid) {
      refreshProfile();
    } else {
      setProfileData(null);
      setProfileLoading(false);
      setSessionValid(false);
    }
  }, [user?.uid]);

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to load stored auth state first
        const storedAuth = await loadAuthState();
        
        if (storedAuth) {
          console.log("📱 Found stored authentication data");
          setSessionValid(true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = authStateListener(async (user: User | null) => {
      console.log("🔐 Auth state changed:", user ? `User ${user.uid}` : "No user");
      
      setUser(user);
      setLoading(false);
      
      // Save auth state whenever it changes
      if (user) {
        await saveAuthState(user, profileData);
        setSessionValid(true);
      } else {
        await saveAuthState(null, null);
        setSessionValid(false);
      }
    });

    return unsubscribe;
  }, [profileData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileData,
        profileLoading,
        refreshProfile,
        isAuthenticated: !!user,
        sessionValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
