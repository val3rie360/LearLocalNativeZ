import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseconfig";
import { logOut } from "../../services/authServices";

type User = {
  id: string;
  name: string;
  email: string;
  role: "student" | "organization" | "admin";
  createdAt: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationFileUrl?: string;
};

function StatusTag({ status }: { status: User["verificationStatus"] }) {
  let bg = "";
  let text = "";
  if (status === "pending") {
    bg = "bg-yellow-100";
    text = "text-yellow-800";
  } else if (status === "verified") {
    bg = "bg-green-100";
    text = "text-green-800";
  } else {
    bg = "bg-red-100";
    text = "text-red-800";
  }
  return (
    <View className={`px-2 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-karla-bold ${text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

export default function SuperAdminReview() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const profilesSnapshot = await getDocs(collection(db, "profiles"));
      const usersData: User[] = profilesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "No email",
            role: data.role || "student",
            createdAt: data.createdAt?.seconds
              ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
              : "Unknown date",
            verificationStatus: data.verificationStatus || "pending",
            verificationFileUrl: data.verificationFileUrl || null,
          };
        })
        .filter((user) => user.role === "organization"); // Filter out admin accounts
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateVerificationStatus = async (
    userId: string,
    status: User["verificationStatus"]
  ) => {
    try {
      await updateDoc(doc(db, "profiles", userId), {
        verificationStatus: status,
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, verificationStatus: status } : user
        )
      );
    } catch (error) {
      console.error("Error updating verification status:", error);
      Alert.alert("Error", "Failed to update verification status.");
    }
  };

  const handleApprove = (userId: string, name: string) => {
    Alert.alert(
      "Approve organization",
      `Are you sure you want to verify ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: () => updateVerificationStatus(userId, "verified"),
        },
      ]
    );
  };

  const handleReject = (userId: string, name: string) => {
    Alert.alert("Reject organization", `Reject ${name}'s verification?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => updateVerificationStatus(userId, "rejected"),
      },
    ]);
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileUrl);
      const isPdf = /\.pdf$/i.test(fileUrl);

      if (isImage) {
        setSelectedImage(fileUrl);
        setModalVisible(true);
        return;
      }

      if (isPdf) {
        // Ensure https and proper Cloudinary delivery
        let url = fileUrl;
        if (url.startsWith("http://")) {
          url = url.replace("http://", "https://");
        }
        if (url.includes("/image/upload/")) {
          url = url.replace("/image/upload/", "/raw/upload/");
        }

        const fileName = url.split("/").pop() || "verification.pdf";
        const fileUri = FileSystem.documentDirectory + fileName;

        console.log("Downloading PDF to:", fileUri);

        const downloadResult = await FileSystem.downloadAsync(url, fileUri);

        console.log("Download complete:", downloadResult.uri);

        // Set the local file for the PDF viewer
        setSelectedPdf(downloadResult.uri);
        setModalVisible(true);
      } else {
        // Fallback for other file types
        Linking.openURL(fileUrl);
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Unable to open the file.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#F6F4FE] justify-center items-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#4B1EB4" />
        <Text className="mt-4 text-[#6B7280] font-karla">Loading users...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-[22px] font-karla-bold text-[#18181B]">
            Account Verification
          </Text>
          <TouchableOpacity
            className="bg-red-500 rounded-full px-4 py-2 flex-row items-center"
            onPress={handleLogout}
          >
            <Text className="text-white font-karla-bold text-[14px]">
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {users.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Text className="text-[#6B7280] font-karla">No users found</Text>
          </View>
        ) : (
          users.map((user) => (
            <View
              key={user.id}
              className="bg-white rounded-2xl p-4 mb-4 shadow border border-[#E5E0FF]"
            >
              <View className="flex-row items-center mb-2">
                {user.role === "student" ? (
                  <Ionicons
                    name="person-circle"
                    size={32}
                    color="#4B1EB4"
                    style={{ marginRight: 10 }}
                  />
                ) : (
                  <FontAwesome5
                    name="school"
                    size={28}
                    color="#4B1EB4"
                    style={{ marginRight: 10 }}
                  />
                )}
                <View className="flex-1">
                  <Text className="font-karla-bold text-[16px] text-[#18181B]">
                    {user.name}
                  </Text>
                  <Text className="font-karla text-[13px] text-[#6B7280]">
                    {user.email}
                  </Text>
                  <Text className="font-karla text-[13px] text-[#6B7280] capitalize">
                    {user.role}
                  </Text>
                </View>
                <StatusTag status={user.verificationStatus} />
              </View>
              <Text className="text-[12px] text-[#A1A1AA] font-karla mb-2">
                Joined: {user.createdAt}
              </Text>

              {user.role === "organization" &&
                (user.verificationFileUrl ? (
                  <TouchableOpacity
                    className="bg-[#E5E0FF] rounded-lg py-2 px-3 mb-2 flex-row items-center"
                    onPress={() => handleViewFile(user.verificationFileUrl!)}
                  >
                    <Ionicons
                      name="document-attach"
                      size={18}
                      color="#4B1EB4"
                    />
                    <Text className="text-[#4B1EB4] font-karla-bold ml-2">
                      Open verification PDF
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-[12px] text-[#A1A1AA] font-karla mb-2">
                    No verification file uploaded.
                  </Text>
                ))}

              {user.verificationStatus === "pending" && (
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-green-100 rounded-full py-2 items-center"
                    onPress={() => handleApprove(user.id, user.name)}
                  >
                    <Text className="text-green-800 font-karla-bold">
                      Approve
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-100 rounded-full py-2 items-center"
                    onPress={() => handleReject(user.id, user.name)}
                  >
                    <Text className="text-red-800 font-karla-bold">Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false} // make modal full screen
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedImage(null);
          setSelectedPdf(null);
        }}
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity
            className="absolute top-12 right-6 z-50"
            onPress={() => {
              setModalVisible(false);
              setSelectedImage(null);
              setSelectedPdf(null);
            }}
          >
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>

          {/* Image fills screen (contain) */}
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}

          {/* PDF fills the entire modal */}
          {selectedPdf && (
            <View className="flex-1 w-full">
              <Pdf
                source={{ uri: selectedPdf, cache: true }}
                style={{ flex: 1, width: "100%" }}
                onError={(error) => {
                  Alert.alert(
                    "PDF Error",
                    (error as { message?: string })?.message || String(error)
                  );
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
