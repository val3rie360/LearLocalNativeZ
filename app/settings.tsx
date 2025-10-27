import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { logOut } from "../services/authServices";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const router = useRouter();
  const { user, profileData } = useAuth();
  const { isDark, theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  console.log("🔧 Settings page loaded successfully!");

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logOut();
            console.log("User logged out successfully");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/editaccount");
  };

  const handleChangePassword = () => {
    router.push("/forgotpassword");
  };

  const handlePrivacyPolicy = () => {
    Alert.alert("Privacy Policy", "Privacy policy will be available soon.");
  };

  const handleTermsOfService = () => {
    Alert.alert("Terms of Service", "Terms of service will be available soon.");
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "For support, please email us at support@learnlocal.com"
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About LearnLocal",
      "LearnLocal v1.0.0\n\nLearning starts where you are.\n\n© 2024 LearnLocal. All rights reserved."
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{ backgroundColor: theme.secondary }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4"
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              style={{ color: theme.text }}
              className="text-[24px] font-karla-bold"
            >
              Settings
            </Text>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Profile Section */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-[18px] font-karla-bold text-[#18181B] mb-4">
              Profile
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handleEditProfile}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#EAE8FD] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="person" size={20} color="#7D7CFF" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Edit Profile
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Update your personal information
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-[#E5E7EB] my-2" />

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handleChangePassword}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#FEF3C7] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="lock-closed" size={20} color="#D97706" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Change Password
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Update your password
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-[18px] font-karla-bold text-[#18181B] mb-4">
              Preferences
            </Text>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#DCFCE7] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="notifications" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Push Notifications
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Receive notifications about opportunities
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E7EB", true: "#7D7CFF" }}
                thumbColor={notificationsEnabled ? "#fff" : "#fff"}
              />
            </View>

            <View className="h-px bg-[#E5E7EB] my-2" />

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#F3E8FF] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="moon" size={20} color="#7C3AED" />
                </View>
                <View>
                  <Text
                    style={{ color: theme.text }}
                    className="text-[16px] font-karla-bold"
                  >
                    Dark Mode
                  </Text>
                  <Text
                    style={{ color: theme.textSecondary }}
                    className="text-[14px] font-karla"
                  >
                    {isDark ? "Switch to light theme" : "Switch to dark theme"}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Support Section */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-[18px] font-karla-bold text-[#18181B] mb-4">
              Support
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handleContactSupport}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#FEE2E2] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="help-circle" size={20} color="#DC2626" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Contact Support
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Get help and support
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-[#E5E7EB] my-2" />

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handlePrivacyPolicy}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#E0F2FE] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="shield-checkmark" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Privacy Policy
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    How we protect your data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="h-px bg-[#E5E7EB] my-2" />

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handleTermsOfService}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#F0FDF4] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="document-text" size={20} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    Terms of Service
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Terms and conditions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-[18px] font-karla-bold text-[#18181B] mb-4">
              About
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-between py-3"
              onPress={handleAbout}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#FEF3C7] rounded-lg items-center justify-center mr-3">
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#D97706"
                  />
                </View>
                <View>
                  <Text className="text-[16px] font-karla-bold text-[#18181B]">
                    About LearnLocal
                  </Text>
                  <Text className="text-[14px] font-karla text-[#6B7280]">
                    Version 1.0.0
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <TouchableOpacity
              className="flex-row items-center justify-center py-4"
              onPress={handleLogout}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#FEE2E2] rounded-lg items-center justify-center mr-3">
                  <Ionicons name="log-out" size={20} color="#DC2626" />
                </View>
                <Text className="text-[16px] font-karla-bold text-[#DC2626]">
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View className="bg-[#F3F4F6] rounded-2xl p-4 mb-6">
            <Text className="text-[14px] font-karla text-[#6B7280] text-center">
              Logged in as: {profileData?.email || user?.email || "Unknown"}
            </Text>
            <Text className="text-[12px] font-karla text-[#9CA3AF] text-center mt-1">
              Role: {profileData?.role || "Unknown"}
            </Text>
          </View>
        </View>
      </ScrollView>
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
