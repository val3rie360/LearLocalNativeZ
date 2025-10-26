import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

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

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const router = useRouter();
  const { user, profileData, profileLoading } = useAuth();
  const [avatarError, setAvatarError] = useState(false);

  const rawAvatarUrl =
    (profileData as { photoURL?: string | null })?.photoURL ??
    user?.photoURL ??
    "";

  useEffect(() => {
    setAvatarError(false);
  }, [rawAvatarUrl]);

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (profileLoading) return "Loading...";
    return (
      profileData?.name ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "User"
    );
  };

  // Get display email
  const getDisplayEmail = () => {
    if (profileLoading) return "Loading...";
    return profileData?.email || user?.email || "No email";
  };

  // Determine avatar icon based on role
  const isOrg = profileData?.role === "organization";

  const SettingsContent = () => (
    <SafeAreaView className="flex-1 px-5">
      {/* Back Arrow */}
      <TouchableOpacity
        className="mt-9 mb-2 w-8"
        hitSlop={10}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity>

      {/* Title */}
      <Text className="font-karla-bold text-[26px] text-[#18181B] mb-4">
        Settings
      </Text>

      {/* Profile Row */}
      <TouchableOpacity
        className="flex-row items-center mb-7"
        onPress={() => router.push("/editaccount")}
      >
        <View className="bg-[#F6F4FE] rounded-full w-12 h-12 items-center justify-center mr-3 overflow-hidden">
          {rawAvatarUrl && !avatarError ? (
            <ExpoImage
              source={{ uri: rawAvatarUrl }}
              style={{
                width: "100%",
                borderColor: "#b8b3e863",
                borderRadius: 48,
                borderWidth: 3,
                height: "100%",
              }}
              contentFit="cover"
              onError={(error) => {
                console.error("[Settings] avatar display error:", error);
                setAvatarError(true);
              }}
            />
          ) : isOrg ? (
            <FontAwesome name="users" size={36} color="#7D7CFF" />
          ) : (
            <FontAwesome name="user-circle-o" size={36} color="#18181B" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-karla-bold text-[15px] text-[#18181B]">
            {getDisplayName()}
          </Text>
          <Text className="font-karla text-[13px] text-[#6B7280]">
            {getDisplayEmail()}
          </Text>
          <Text className="font-karla text-[12px] text-[#6B7280] mt-1">
            {profileData?.role === "organization" ? "Organization" : "Student"}{" "}
            • Tap to edit
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#18181B" />
      </TouchableOpacity>

      {/* Divider */}
      <View className="h-[1px] bg-[#E5E0FF] mb-6" />

      {/* Dark Mode */}
      <View className="flex-row items-center justify-between mb-7">
        <View className="flex-row items-center">
          <View className="bg-[#E5E0FF] rounded-lg w-9 h-9 items-center justify-center mr-3">
            <Ionicons name="moon" size={20} color="#7D7CFF" />
          </View>
          <Text className="font-karla-bold text-[15px] text-[#18181B]">
            Dark Mode
          </Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: "#E5E0FF", true: "#7D7CFF" }}
          thumbColor={darkMode ? "#fff" : "#fff"}
        />
      </View>

      {/* Notifications Label */}
      <Text className="font-karla text-[13px] text-[#6B7280] mb-2">
        Notifications
      </Text>

      {/* Notifications Toggle */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="bg-[#E5E0FF] rounded-lg w-9 h-9 items-center justify-center mr-3">
            <Ionicons name="notifications" size={20} color="#7D7CFF" />
          </View>
          <Text className="font-karla-bold text-[15px] text-[#18181B]">
            Notifications
          </Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: "#E5E0FF", true: "#7D7CFF" }}
          thumbColor={notifications ? "#fff" : "#fff"}
        />
      </View>

      {/* Version */}
      <View className="flex-1 justify-end items-center pb-4">
        <Text className="font-karla text-[#18181B] text-[13px]">
          App ver 1.0.1
        </Text>
      </View>
    </SafeAreaView>
  );

  return isOrg ? (
    <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
      <SettingsContent />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: "#F6F4FE" }}>
      <SettingsContent />
    </View>
  );
}
