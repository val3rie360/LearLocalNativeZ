import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cloudinaryConfig, getImageUploadUrl } from "../cloudinaryConfig";
import { useAuth } from "../contexts/AuthContext";
import { updateUserProfile } from "../services/firestoreService";

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

export default function EditAccount() {
  const router = useRouter();
  const { user, profileData, profileLoading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const fallbackAvatarPresetEnv =
    process.env.EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET ||
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    "";
  const avatarUploadPreset = (
    fallbackAvatarPresetEnv ||
    cloudinaryConfig.avatarPreset ||
    ""
  ).trim();
  const isPresetPlaceholder =
    !fallbackAvatarPresetEnv && avatarUploadPreset === "unsigned_preset";
  const avatarUploadFolder =
    process.env.EXPO_PUBLIC_CLOUDINARY_AVATAR_FOLDER ||
    cloudinaryConfig.avatarFolder ||
    "";
  const cloudinaryImageUploadUrl =
    cloudinaryConfig.cloudName &&
    cloudinaryConfig.cloudName !== "your-cloud-name"
      ? getImageUploadUrl()
      : "";
  const isCloudinaryConfigured =
    !!cloudinaryImageUploadUrl && !!avatarUploadPreset && !isPresetPlaceholder;

  useEffect(() => {
    if (profileData) {
      const profilePhoto =
        (profileData as { photoURL?: string | null })?.photoURL ??
        user?.photoURL ??
        "";
      setName(profileData?.name || user?.displayName || "");
      setEmail(profileData?.email || user?.email || "");
      setAvatarUrl(profilePhoto);
      setAvatarError(false);
    }
  }, [profileData, user]);

  const handleSaveChanges = async () => {
    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      const trimmedName = name.trim();
      const currentPhoto = user.photoURL ?? "";
      if (
        trimmedName !== (user.displayName ?? "") ||
        avatarUrl !== currentPhoto
      ) {
        await updateProfile(user, {
          displayName: trimmedName,
          photoURL: avatarUrl || undefined,
        });
      }

      // Update email if changed
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      // Update password if provided
      if (password.trim()) {
        await updatePassword(user, password);
      }

      // Update Firestore profile
      const updatedProfileData = {
        name: trimmedName,
        email: email.trim(),
        photoURL: avatarUrl || null,
        updatedAt: new Date(),
      };

      await updateUserProfile(user.uid, updatedProfileData);

      // Refresh profile data to update all components
      await refreshProfile();

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Determine avatar icon based on role
  const isOrg = profileData?.role === "organization";

  const handlePickAvatar = async () => {
    if (!isCloudinaryConfigured) {
      Alert.alert(
        "Cloudinary not configured",
        "Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET to your .env, then restart the app."
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow photo library access to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    try {
      setAvatarUploading(true);

      const asset = result.assets[0];
      setAvatarUrl(asset.uri); // show immediate preview
      setAvatarError(false);

      const extension = asset.mimeType?.split("/").pop() ?? "jpg";
      const fileName =
        asset.fileName ?? `avatar_${user?.uid ?? "user"}.${extension}`;

      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: fileName,
        type: asset.mimeType ?? "image/jpeg",
      } as any);
      formData.append("upload_preset", avatarUploadPreset);
      if (avatarUploadFolder) {
        formData.append("folder", avatarUploadFolder);
      }

      const response = await fetch(cloudinaryImageUploadUrl, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Avatar] Upload failed:", errorText);
        throw new Error("Upload failed.");
      }

      const uploadResult = await response.json();
      console.log("[Avatar] Cloudinary response:", uploadResult);

      const secureUrl =
        typeof uploadResult.secure_url === "string" &&
        uploadResult.secure_url.startsWith("http")
          ? uploadResult.secure_url
          : uploadResult.url;

      if (!secureUrl || typeof secureUrl !== "string") {
        throw new Error("Upload error: secure_url missing.");
      }

      setAvatarUrl(secureUrl as string); // persisted Cloudinary URL
      setAvatarError(false);
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload image.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const EditAccountContent = () => (
    <SafeAreaView className="flex-1 px-6 pt-6">
      {/* Back Arrow */}
      <TouchableOpacity
        className="absolute left-5 top-20"
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/settings");
          }
        }}
        hitSlop={10}
      >
        <Ionicons name="arrow-back" size={24} color="#18181B" />
      </TouchableOpacity>

      {/* Title */}
      <Text className="text-center text-[22px] font-karla-bold mt-2 mb-6 text-[#18181B]">
        Edit Account
      </Text>

      {/* Profile Image */}
      <View className="items-center mb-8">
        <View className="relative">
          {avatarUrl && !avatarError ? (
            <ExpoImage
              source={{ uri: avatarUrl }}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 4,
                borderColor: "#b8b3e863",
              }}
              contentFit="cover"
              transition={200}
              onError={(err) => {
                console.error("[Avatar] display error:", err);
                setAvatarError(true);
              }}
            />
          ) : isOrg ? (
            <View
              className="bg-white rounded-full w-24 h-24 items-center justify-center border-4 border-[#ECEAFF] shadow"
              style={{ elevation: 0 }}
            >
              <FontAwesome name="users" size={56} color="#7D7CFF" />
            </View>
          ) : (
            <FontAwesome name="user-circle-o" size={90} color="#18181B" />
          )}
          <TouchableOpacity
            className="absolute bottom-2 -right-3 bg-white rounded-full p-1.5 shadow border border-[#e0d7ff]"
            style={{ elevation: 2 }}
            onPress={handlePickAvatar}
            disabled={avatarUploading}
          >
            {avatarUploading ? (
              <ActivityIndicator size="small" color="#4B1EB4" />
            ) : (
              <MaterialIcons name="photo-camera" size={22} color="#4B1EB4" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-[#e0e0e0] mb-6" />

      {/* Name Field */}
      <Text className="text-[15px] font-karla-bold mb-1 text-[#18181B]">
        Name
      </Text>
      <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
        <Feather
          name="user"
          size={18}
          color="#A1A1AA"
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-base font-karla text-[#222]"
          value={profileLoading ? "Loading..." : name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor="#A1A1AA"
          editable={!profileLoading}
        />
      </View>

      {/* Email Field */}
      <Text className="text-[15px] font-karla-bold mb-1 text-[#18181B]">
        Email
      </Text>
      <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
        <Feather
          name="mail"
          size={18}
          color="#A1A1AA"
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-base font-karla text-[#222]"
          value={profileLoading ? "Loading..." : email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#A1A1AA"
          keyboardType="email-address"
          editable={!profileLoading}
        />
      </View>

      {/* Password Field */}
      <Text className="text-[15px] font-karla-bold mb-1 text-[#18181B]">
        Change Password
      </Text>
      <View className="flex-row items-center bg-white rounded-full px-4 mb-8 h-12 shadow border border-[#e0d7ff]">
        <Feather
          name="lock"
          size={18}
          color="#A1A1AA"
          style={{ marginRight: 8 }}
        />
        <TextInput
          className="flex-1 text-base font-karla text-[#222]"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password (leave blank to keep current)"
          placeholderTextColor="#A1A1AA"
          secureTextEntry={!showPassword}
          editable={!profileLoading}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((v) => !v)}
          className="p-1 ml-1"
          activeOpacity={1}
          disabled={profileLoading}
        >
          <Feather
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#A1A1AA"
          />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        className={`rounded-full py-4 items-center shadow mt-2 ${
          loading || profileLoading || avatarUploading
            ? "bg-gray-400"
            : "bg-[#4B1EB4] active:opacity-90"
        }`}
        onPress={handleSaveChanges}
        disabled={loading || profileLoading || avatarUploading}
      >
        <Text className="text-white text-base font-karla-bold">
          {avatarUploading
            ? "Uploading..."
            : loading
              ? "Saving..."
              : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return isOrg ? (
    <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
      <EditAccountContent />
    </LinearGradient>
  ) : (
    <View style={{ flex: 1, backgroundColor: "#F6F4FE" }}>
      <EditAccountContent />
    </View>
  );
}
