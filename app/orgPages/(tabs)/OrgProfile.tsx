import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";
import { db } from "../../../firebaseconfig";
import { logOut } from "../../../services/authServices";

interface ProfileData {
  name?: string;
  email?: string;
  role?: "student" | "organization";
  createdAt?: {
    seconds: number;
  };
  verificationFileUrl?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  photoURL?: string;
}

const OrgProfile: React.FC = () => {
  const router = useRouter();
  const { user, profileData, profileLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileInfo, setProfileInfo] = useState<ProfileData | null>(
    (profileData ?? null) as ProfileData | null
  );
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setProfileInfo((profileData ?? null) as ProfileData | null);
    setAvatarError(false);
  }, [profileData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (!user?.uid) return;
      const profileRef = doc(db, "profiles", user.uid);
      const snapshot = await getDoc(profileRef);
      if (snapshot.exists()) {
        setProfileInfo(snapshot.data() as ProfileData);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await logOut();
            console.log("User logged out successfully");
            // The AuthContext will automatically handle the redirect
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };
  return (
    <SafeAreaView className="flex-1 bg-[#ECEAFF]" edges={["top"]}>
      <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4B1EB4"]}
              tintColor="#4B1EB4"
            />
          }
        >
          <View className="flex-1 bg-transparent items-center pt-16">
            <View className="items-center mb-8">
              <View className="bg-white rounded-full w-28 h-28 items-center justify-center border-[#ECEAFF] shadow">
                {profileLoading ? (
                  <FontAwesome name="users" size={72} color="#7D7CFF" />
                ) : profileInfo?.photoURL && !avatarError ? (
                  <ExpoImage
                    source={{ uri: profileInfo.photoURL }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      borderColor: "#b8b3e863",
                      borderWidth: 3,
                    }}
                    contentFit="cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : user?.photoURL && !avatarError ? (
                  <ExpoImage
                    source={{ uri: user.photoURL }}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                    contentFit="cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <FontAwesome name="users" size={72} color="#7D7CFF" />
                )}
              </View>
              <View className="flex-row items-center">
                <Text className="text-[20px] text-white font-karla-bold mb-1">
                  {profileLoading
                    ? "Loading..."
                    : profileInfo?.name ||
                      user?.displayName ||
                      user?.email?.split("@")[0] ||
                      "User"}
                </Text>
                {profileInfo?.verificationStatus === "verified" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#60ecffff"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              <Text className="text-[14px] text-[#7D7CFF] font-karla-bold mb-2">
                {profileInfo?.email || user?.email || "No email"}
              </Text>

              {/* Role Badge */}
              <View className="bg-[#4B1EB4] py-1 px-3 rounded-lg">
                <Text className="text-[14px] text-white font-karla-bold">
                  {profileLoading ? "Loading..." : "Organization"}
                </Text>
              </View>
            </View>

            {/* Additional Profile Info */}
            {profileInfo && (
              <View className="w-[85%] mb-5">
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  <Text className="text-[16px] font-karla-bold text-black mb-3">
                    Profile Information
                  </Text>

                  {/* Registration Date */}
                  {profileInfo.createdAt && (
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-[14px] font-karla text-gray-600">
                        Member since:
                      </Text>
                      <Text className="text-[14px] font-karla-bold text-black">
                        {new Date(
                          profileInfo.createdAt.seconds * 1000
                        ).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {/* Verification Status */}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[14px] font-karla text-gray-600">
                      Verification:
                    </Text>
                    {(() => {
                      const status =
                        profileInfo.verificationStatus || "pending";
                      const badgeStyles: Record<
                        "pending" | "verified" | "rejected",
                        { bg: string; textColor: string; label: string }
                      > = {
                        pending: {
                          bg: "bg-yellow-100",
                          textColor: "text-yellow-800",
                          label: "Pending",
                        },
                        verified: {
                          bg: "bg-green-100",
                          textColor: "text-green-800",
                          label: "Verified",
                        },
                        rejected: {
                          bg: "bg-red-100",
                          textColor: "text-red-800",
                          label: "Rejected",
                        },
                      };
                      const styles = badgeStyles[status];
                      return (
                        <View className={`py-1 px-2 rounded ${styles.bg}`}>
                          <Text
                            className={`text-[12px] font-karla-bold ${styles.textColor}`}
                          >
                            {styles.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </View>
            )}

            {/* Divider */}
            <View className="h-[1px] bg-[#D3D1FA] w-[85%] mb-5" />

            {/* Menu Section */}
            <View className="w-[85%]">
              <TouchableOpacity
                className="flex-row items-center py-1.5 justify-between"
                onPress={() => router.push("../../settings")}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="settings-sharp"
                    size={22}
                    color="#7D7CFF"
                    style={{
                      backgroundColor: "#EAE8FD",
                      borderRadius: 10,
                      padding: 6,
                      marginRight: 12,
                    }}
                  />
                  <Text className="text-[16px] font-karla-bold text-white">
                    Settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#ffffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center py-1.5 justify-between"
                onPress={handleLogout}
                disabled={loading}
              >
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="exit-to-app"
                    size={22}
                    color="#FF6B6B"
                    style={{
                      backgroundColor: "#FFE5E5",
                      borderRadius: 10,
                      padding: 6,
                      marginRight: 12,
                    }}
                  />
                  <Text className="text-[16px] font-karla-bold text-white">
                    {loading ? "Logging out..." : "Log Out"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default OrgProfile;
