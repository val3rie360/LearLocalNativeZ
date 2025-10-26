import { User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authStateListener } from "../services/authServices";
import { getUserProfile } from "../services/firestoreService";

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileData: null,
  profileLoading: true,
  refreshProfile: async () => {},
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

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user?.uid) {
      try {
        setProfileLoading(true);
        const profile = await getUserProfile(user.uid);
        setProfileData(profile);
      } catch (error) {
        console.error("Error refreshing profile data:", error);
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
    }
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = authStateListener((user: User | null) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileData,
        profileLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
