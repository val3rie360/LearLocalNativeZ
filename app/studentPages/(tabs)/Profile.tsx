import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";
import { logOut } from "../../../services/authServices";

interface ProfileData {
  name?: string;
  email?: string;
  role?: "student" | "organization";
  createdAt?: {
    seconds: number;
  };
  verificationFileUrl?: string;
  photoURL?: string;
}

const Profile: React.FC = () => {
  const router = useRouter();
  const { user, profileData, profileLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const rawAvatarUrl =
    (profileData as { photoURL?: string | null })?.photoURL ??
    user?.photoURL ??
    "";

  useEffect(() => {
    setAvatarError(false);
  }, [rawAvatarUrl]);

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
    <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top"]}>
      <View className="flex-1 bg-[#F6F4FE] items-center pt-16">
        <View className="items-center mb-8">
          <View className="bg-[#EAE8FD] rounded-full p-1.5 mb-2">
            <View className="bg-white rounded-full w-24 h-24 items-center justify-center overflow-hidden border border-[#EAE8FD]">
              {rawAvatarUrl && !avatarError ? (
                <ExpoImage
                  source={{ uri: rawAvatarUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  onError={(error) => {
                    console.error("[Profile] avatar display error:", error);
                    setAvatarError(true);
                  }}
                />
              ) : (
                <FontAwesome name="user-circle-o" size={85} color="#000" />
              )}
            </View>
          </View>

          {/* Display Name */}
          <Text className="text-[20px] text-black font-karla-bold mb-1">
            {profileLoading
              ? "Loading..."
              : profileData?.name ||
                user?.displayName ||
                user?.email?.split("@")[0] ||
                "User"}
          </Text>

          {/* Email */}
          <Text className="text-[14px] text-[#7D7CFF] font-karla-bold mb-2">
            {profileData?.email || user?.email || "No email"}
          </Text>

          {/* Role Badge */}
          <View
            className={`py-1 px-3 rounded-lg ${
              profileData?.role === "organization"
                ? "bg-[#4B1EB4]"
                : "bg-[#FFB3B3]"
            }`}
          >
            <Text className="text-[14px] text-white font-karla-bold">
              {profileLoading
                ? "Loading..."
                : profileData?.role === "organization"
                  ? "Organization"
                  : "Student"}
            </Text>
          </View>
        </View>

        {/* Additional Profile Info */}
        {profileData && (
          <View className="w-[85%] mb-5">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-[16px] font-karla-bold text-black mb-3">
                Profile Information
              </Text>

              {/* Registration Date */}
              {profileData.createdAt && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[14px] font-karla text-gray-600">
                    Member since:
                  </Text>
                  <Text className="text-[14px] font-karla-bold text-black">
                    {new Date(
                      profileData.createdAt.seconds * 1000
                    ).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {/* Verification Status for Organizations */}
              {profileData.role === "organization" && (
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[14px] font-karla text-gray-600">
                    Verification:
                  </Text>
                  <View
                    className={`py-1 px-2 rounded ${
                      profileData.verificationFileUrl
                        ? "bg-green-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-karla-bold ${
                        profileData.verificationFileUrl
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {profileData.verificationFileUrl ? "Verified" : "Pending"}
                    </Text>
                  </View>
                </View>
              )}
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
              <Text className="text-[16px] font-karla-bold text-black">
                Settings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000000ff" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3 justify-between"
            onPress={() => router.replace("../communitypage")}
          >
            <View className="flex-row items-center">
              <FontAwesome
                name="users"
                size={22}
                color="#7D7CFF"
                style={{
                  backgroundColor: "#EAE8FD",
                  borderRadius: 10,
                  padding: 6,
                  marginRight: 12,
                }}
              />
              <Text className="text-[16px] font-karla-bold text-black">
                Community Board
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000000ff" />
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
              <Text className="text-[16px] font-karla-bold text-[#FF6B6B]">
                {loading ? "Logging out..." : "Log Out"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Profile;
