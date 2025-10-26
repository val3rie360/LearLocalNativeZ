import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";
import {
  archiveUpload,
  deleteUpload,
  formatFileSize,
  getOrganizationUploads,
  updateUploadMetadata,
} from "../../../services/cloudinaryUploadService";

const FileCard = ({
  upload,
  onPress,
  onOptions,
}: {
  upload: any;
  onPress: () => void;
  onOptions: () => void;
}) => {
  const thumbnailUrl = upload.cloudinarySecureUrl
    ? upload.cloudinarySecureUrl.replace(
        "/upload/",
        "/upload/w_150,h_150,c_fill,f_auto,q_auto/"
      )
    : null;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };
  const { user, profileData } = useAuth();
  const isVerified = profileData?.verificationStatus === "verified";

  return (
    <View className="bg-white rounded-2xl p-4 items-center m-2 flex-1 min-w-[140px] max-w-[48%] shadow-md">
      {/* Options Button (Top Right) */}
      <TouchableOpacity
        onPress={onOptions}
        className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-1.5"
      >
        <Feather name="more-vertical" size={16} color="#666" />
      </TouchableOpacity>

      {/* PDF Thumbnail or Icon */}
      <TouchableOpacity onPress={onPress} className="mb-3 w-full items-center">
        {thumbnailUrl ? (
          <View className="relative">
            <Image
              source={{ uri: thumbnailUrl }}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
            <View className="absolute bottom-0 right-0 bg-red-500 rounded-full p-1">
              <Text className="text-white text-[10px] font-karla-bold">
                PDF
              </Text>
            </View>
          </View>
        ) : (
          <View className="bg-red-50 rounded-lg p-4">
            <Feather name="file-text" size={48} color="#EF4444" />
          </View>
        )}
      </TouchableOpacity>

      {/* File Info */}
      <TouchableOpacity onPress={onPress} className="w-full">
        <Text
          className="text-[15px] font-karla-bold text-[#222] mb-1 text-center"
          numberOfLines={2}
        >
          {upload.displayName || upload.fileName}
        </Text>
        <Text className="text-xs text-[#888] text-center font-karla mb-1">
          {formatDate(upload.createdAt)}
        </Text>
        <Text className="text-xs text-[#666] text-center font-karla">
          {formatFileSize(upload.fileSize)}
        </Text>

        {/* Download Count */}
        {upload.downloadCount > 0 && (
          <View className="flex-row items-center justify-center mt-2">
            <MaterialIcons name="download" size={12} color="#6C63FF" />
            <Text className="text-xs text-[#6C63FF] ml-1 font-karla">
              {upload.downloadCount} downloads
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function OrgUploads() {
  const router = useRouter();
  const { user, profileData } = useAuth();
  const [uploads, setUploads] = useState<any[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // File management states
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // PDF viewer states
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isVerified = profileData?.verificationStatus === "verified";

  // Fetch uploads
  const fetchUploads = async () => {
    if (!user?.uid) return;

    try {
      setError("");
      console.log("Fetching uploads for organization:", user.uid);
      const data = await getOrganizationUploads(user.uid);
      console.log("Fetched uploads:", data.length);
      setUploads(data);
      setFilteredUploads(data);
    } catch (err: any) {
      console.error("Error fetching uploads:", err);
      setError(err.message || "Failed to load uploads");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [user?.uid]);

  // Sort uploads
  const sortUploads = (uploadsToSort: any[]) => {
    const sorted = [...uploadsToSort];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          comparison = bTime - aTime;
          break;
        case "name":
          const aName = (a.displayName || a.fileName || "").toLowerCase();
          const bName = (b.displayName || b.fileName || "").toLowerCase();
          comparison = bName.localeCompare(aName);
          break;
        case "size":
          comparison = (b.fileSize || 0) - (a.fileSize || 0);
          break;
      }

      return sortOrder === "asc" ? -comparison : comparison;
    });

    return sorted;
  };

  // Handle search and sort
  useEffect(() => {
    let result = uploads;

    // Apply search filter
    if (searchQuery.trim() !== "") {
      result = result.filter((upload) =>
        (upload.displayName || upload.fileName)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result = sortUploads(result);

    setFilteredUploads(result);
  }, [searchQuery, uploads, sortBy, sortOrder]);

  // Handle file open
  const handleFilePress = async (upload: any) => {
    try {
      let url = upload.cloudinarySecureUrl || upload.cloudinaryUrl;
      if (!url) return;

      // Normalize http -> https and Cloudinary raw delivery for PDFs
      if (url.startsWith("http://")) url = url.replace("http://", "https://");
      if (url.includes("/image/upload/"))
        url = url.replace("/image/upload/", "/raw/upload/");

      const looksLikePdf =
        /\.pdf(\?|$)/i.test(url) || /\.pdf$/i.test(upload.fileName || "");

      if (!looksLikePdf) {
        // fallback: open in external browser if not a PDF
        await Linking.openURL(url);
        return;
      }

      const fileName = (
        upload.fileName ||
        url.split("/").pop() ||
        "file.pdf"
      ).split("?")[0];
      const dest = FileSystem.documentDirectory + fileName;
      console.log("Downloading PDF to:", dest);

      const downloadResult = await FileSystem.downloadAsync(url, dest);
      console.log("Download complete:", downloadResult.uri);

      setSelectedPdf(downloadResult.uri);
      setModalVisible(true);
    } catch (err) {
      console.error("Error opening file:", err);
      Alert.alert("Error", "Failed to open file. Try again.");
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUploads();
  };

  // Handle file options
  const handleFileOptions = (upload: any) => {
    setSelectedFile(upload);
    setShowOptionsModal(true);
  };

  // Handle edit file
  const handleEditFile = () => {
    if (!selectedFile) return;

    setEditDisplayName(selectedFile.displayName || selectedFile.fileName || "");
    setEditDescription(selectedFile.description || "");
    setEditCategory(selectedFile.category || "");
    setEditTags(selectedFile.tags?.join(", ") || "");
    setShowOptionsModal(false);
    setShowEditModal(true);
  };

  // Save file edits
  const handleSaveEdit = async () => {
    if (!selectedFile) return;

    try {
      setActionLoading(true);

      const updateData: any = {
        displayName: editDisplayName.trim(),
        description: editDescription.trim(),
        category: editCategory.trim() || "Uncategorized",
      };

      // Parse tags
      if (editTags.trim()) {
        updateData.tags = editTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      } else {
        updateData.tags = [];
      }

      await updateUploadMetadata(selectedFile.id, updateData);

      setSuccessMessage("File updated successfully!");
      setShowEditModal(false);
      setSelectedFile(null);

      // Refresh uploads
      await fetchUploads();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error updating file:", err);
      Alert.alert("Error", err.message || "Failed to update file");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle hide/archive file
  const handleHideFile = () => {
    if (!selectedFile) return;

    Alert.alert(
      "Hide File",
      `Are you sure you want to hide "${selectedFile.displayName || selectedFile.fileName}"? It will no longer be visible to students but can be restored later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Hide",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              setShowOptionsModal(false);

              await archiveUpload(selectedFile.id);

              setSuccessMessage("File hidden successfully!");
              setSelectedFile(null);

              // Refresh uploads
              await fetchUploads();

              setTimeout(() => setSuccessMessage(""), 3000);
            } catch (err: any) {
              console.error("Error hiding file:", err);
              Alert.alert("Error", err.message || "Failed to hide file");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle delete file
  const handleDeleteFile = () => {
    if (!selectedFile) return;

    Alert.alert(
      "Delete File",
      `Are you sure you want to permanently delete "${selectedFile.displayName || selectedFile.fileName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              setShowOptionsModal(false);

              await deleteUpload(
                selectedFile.id,
                selectedFile.cloudinaryPublicId
              );

              setSuccessMessage("File deleted successfully!");
              setSelectedFile(null);

              // Refresh uploads
              await fetchUploads();

              setTimeout(() => setSuccessMessage(""), 3000);
            } catch (err: any) {
              console.error("Error deleting file:", err);
              Alert.alert("Error", err.message || "Failed to delete file");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#ECEAFF]" edges={["top"]}>
      <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
        <View className="flex-1 px-5 pt-8">
          {/* Header */}
          <View className="flex-col mb-3.5">
            <Text className="text-[28px] text-[#222] font-karla-bold mt-2">
              My Uploads
            </Text>
            <Text className="text-[15px] text-black mt-1 font-karla">
              {uploads.length} file{uploads.length !== 1 ? "s" : ""} uploaded
            </Text>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-3xl px-4 h-11 mb-4.5 border border-[#ECECEC]">
            <Feather
              name="search"
              size={18}
              color="#000000ff"
              className="mr-2"
            />
            <TextInput
              className="flex-1 text-[15px] text-[#222] font-karla"
              placeholder="Search for learning materials..."
              placeholderTextColor="#B0B0B0"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <View className="h-px bg-[#ECECEC] w-full my-2" />

          {/* Section Title with Sort */}
          <View className="mb-2 mt-2">
            {!isVerified && (
              <Text
                className="w-full text-sm text-red-500 font-karla-bold text-center mb-2"
                style={{ textDecorationLine: "underline" }}
              >
                Your account is pending verification; your uploads are
                temporarily hidden from students.
              </Text>
            )}
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-karla-bold text-[#222]">
                {searchQuery
                  ? `Results (${filteredUploads.length})`
                  : "Your files"}
              </Text>
              <View className="flex-row items-center space-x-2">
                {/* Sort Button */}
                <TouchableOpacity
                  onPress={() => setShowSortMenu(!showSortMenu)}
                  className="flex-row items-center px-2 py-1"
                >
                  <Feather
                    name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                    size={18}
                    color="#6C63FF"
                  />
                  <Text className="text-sm text-[#6C63FF] ml-1 font-karla">
                    {sortBy === "date"
                      ? "Date"
                      : sortBy === "name"
                        ? "Name"
                        : "Size"}
                  </Text>
                </TouchableOpacity>
                {/* Refresh Button */}
                <TouchableOpacity onPress={onRefresh}>
                  <Feather name="refresh-cw" size={20} color="#6C63FF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sort Menu Dropdown */}
          {showSortMenu && (
            <View className="bg-white rounded-xl shadow-lg border border-[#E5E0FF] mb-3 p-2">
              <TouchableOpacity
                className="flex-row items-center py-3 px-4 rounded-lg"
                onPress={() => {
                  setSortBy("date");
                  setShowSortMenu(false);
                }}
              >
                <Feather
                  name="calendar"
                  size={18}
                  color={sortBy === "date" ? "#6C63FF" : "#666"}
                />
                <Text
                  className={`flex-1 ml-3 font-karla ${sortBy === "date" ? "font-karla-bold text-[#6C63FF]" : "text-[#333]"}`}
                >
                  Date
                </Text>
                {sortBy === "date" && (
                  <MaterialIcons name="check" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center py-3 px-4 rounded-lg"
                onPress={() => {
                  setSortBy("name");
                  setShowSortMenu(false);
                }}
              >
                <Feather
                  name="type"
                  size={18}
                  color={sortBy === "name" ? "#6C63FF" : "#666"}
                />
                <Text
                  className={`flex-1 ml-3 font-karla ${sortBy === "name" ? "font-karla-bold text-[#6C63FF]" : "text-[#333]"}`}
                >
                  Name
                </Text>
                {sortBy === "name" && (
                  <MaterialIcons name="check" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center py-3 px-4 rounded-lg"
                onPress={() => {
                  setSortBy("size");
                  setShowSortMenu(false);
                }}
              >
                <Feather
                  name="database"
                  size={18}
                  color={sortBy === "size" ? "#6C63FF" : "#666"}
                />
                <Text
                  className={`flex-1 ml-3 font-karla ${sortBy === "size" ? "font-karla-bold text-[#6C63FF]" : "text-[#333]"}`}
                >
                  Size
                </Text>
                {sortBy === "size" && (
                  <MaterialIcons name="check" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="h-px bg-gray-200 my-2" />

              {/* Reverse Order Button */}
              <TouchableOpacity
                className="flex-row items-center justify-between py-3 px-4 rounded-lg"
                onPress={() => {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                <View className="flex-row items-center">
                  <Feather
                    name={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
                    size={18}
                    color="#6C63FF"
                  />
                  <Text className="ml-3 font-karla text-[#6C63FF]">
                    {sortOrder === "desc" ? "Descending" : "Ascending"}
                  </Text>
                </View>
                <MaterialIcons name="swap-vert" size={20} color="#6C63FF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text className="text-[#666] mt-4 font-karla">
                Loading your uploads...
              </Text>
            </View>
          ) : error ? (
            /* Error State */
            <View className="flex-1 justify-center items-center px-8">
              <Feather name="alert-circle" size={48} color="#EF4444" />
              <Text className="text-[#666] mt-4 text-center font-karla">
                {error}
              </Text>
              <TouchableOpacity
                onPress={fetchUploads}
                className="bg-[#6C63FF] rounded-full px-6 py-3 mt-4"
              >
                <Text className="text-white font-karla-bold">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Files Grid */
            <FlatList
              data={filteredUploads}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 24 }}
              refreshing={refreshing}
              onRefresh={onRefresh}
              renderItem={({ item }) => (
                <FileCard
                  upload={item}
                  onPress={() => handleFilePress(item)}
                  onOptions={() => handleFileOptions(item)}
                />
              )}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-12">
                  <Feather name="inbox" size={64} color="#CCC" />
                  <Text className="text-center text-[#666] mt-4 text-[16px] font-karla-bold">
                    {searchQuery ? "No files found" : "No uploads yet"}
                  </Text>
                  <Text className="text-center text-[#888] mt-2 text-[14px] font-karla px-8">
                    {searchQuery
                      ? "Try a different search term"
                      : "Upload your first PDF from the Create tab"}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Success Message */}
          {successMessage !== "" && (
            <View className="absolute bottom-8 left-5 right-5 bg-green-500 rounded-xl px-4 py-3 flex-row items-center shadow-lg">
              <MaterialIcons name="check-circle" size={24} color="white" />
              <Text className="text-white font-karla-bold ml-2 flex-1">
                {successMessage}
              </Text>
            </View>
          )}
        </View>

        {/* File Options Modal */}
        <Modal
          visible={showOptionsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowOptionsModal(false)}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              className="bg-white rounded-t-3xl p-6"
            >
              {/* Modal Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-karla-bold text-[#222]">
                  File Options
                </Text>
                <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                  <Feather name="x" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* File Info */}
              {selectedFile && (
                <View className="bg-gray-50 rounded-xl p-4 mb-6">
                  <Text
                    className="font-karla-bold text-[#222] mb-1"
                    numberOfLines={2}
                  >
                    {selectedFile.displayName || selectedFile.fileName}
                  </Text>
                  <Text className="text-sm text-[#666] font-karla">
                    {formatFileSize(selectedFile.fileSize)} •{" "}
                    {selectedFile.category || "Uncategorized"}
                  </Text>
                </View>
              )}

              {/* Options */}
              <View className="space-y-2">
                {/* Edit */}
                <TouchableOpacity
                  onPress={handleEditFile}
                  className="flex-row items-center p-4 bg-gray-50 rounded-xl"
                >
                  <View className="bg-blue-100 p-2 rounded-full">
                    <Feather name="edit-2" size={20} color="#3B82F6" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-karla-bold text-[#222]">
                      Edit Details
                    </Text>
                    <Text className="text-sm text-[#666] font-karla">
                      Update name, description, and tags
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                {/* Hide */}
                <TouchableOpacity
                  onPress={handleHideFile}
                  className="flex-row items-center p-4 bg-gray-50 rounded-xl"
                >
                  <View className="bg-orange-100 p-2 rounded-full">
                    <Feather name="eye-off" size={20} color="#F97316" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-karla-bold text-[#222]">
                      Hide File
                    </Text>
                    <Text className="text-sm text-[#666] font-karla">
                      Make invisible to students
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#999" />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={handleDeleteFile}
                  className="flex-row items-center p-4 bg-red-50 rounded-xl"
                >
                  <View className="bg-red-100 p-2 rounded-full">
                    <Feather name="trash-2" size={20} color="#EF4444" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="font-karla-bold text-red-600">
                      Delete File
                    </Text>
                    <Text className="text-sm text-red-500 font-karla">
                      Permanently remove this file
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => setShowOptionsModal(false)}
                className="mt-6 bg-gray-200 rounded-xl py-4"
              >
                <Text className="text-center font-karla-bold text-[#222]">
                  Cancel
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Edit File Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-20 bg-white rounded-t-3xl">
              <ScrollView className="flex-1 px-6 pt-6">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-2xl font-karla-bold text-[#222]">
                    Edit File Details
                  </Text>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                    <Feather name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Display Name */}
                <View className="mb-5">
                  <Text className="text-sm font-karla-bold text-[#222] mb-2">
                    Display Name *
                  </Text>
                  <TextInput
                    value={editDisplayName}
                    onChangeText={setEditDisplayName}
                    placeholder="Enter file name"
                    className="bg-gray-50 rounded-xl px-4 py-3 font-karla text-[#222]"
                  />
                </View>

                {/* Description */}
                <View className="mb-5">
                  <Text className="text-sm font-karla-bold text-[#222] mb-2">
                    Description
                  </Text>
                  <TextInput
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Enter file description"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-50 rounded-xl px-4 py-3 font-karla text-[#222] h-24"
                  />
                </View>

                {/* Category */}
                <View className="mb-5">
                  <Text className="text-sm font-karla-bold text-[#222] mb-2">
                    Category
                  </Text>
                  <TextInput
                    value={editCategory}
                    onChangeText={setEditCategory}
                    placeholder="e.g., Math, Science, History"
                    className="bg-gray-50 rounded-xl px-4 py-3 font-karla text-[#222]"
                  />
                </View>

                {/* Tags */}
                <View className="mb-5">
                  <Text className="text-sm font-karla-bold text-[#222] mb-2">
                    Tags (comma-separated)
                  </Text>
                  <TextInput
                    value={editTags}
                    onChangeText={setEditTags}
                    placeholder="e.g., study guide, exam prep, notes"
                    className="bg-gray-50 rounded-xl px-4 py-3 font-karla text-[#222]"
                  />
                  <Text className="text-xs text-[#666] font-karla mt-1">
                    Separate tags with commas
                  </Text>
                </View>

                {/* File Info (Read-only) */}
                {selectedFile && (
                  <View className="bg-blue-50 rounded-xl p-4 mb-6">
                    <Text className="text-sm font-karla-bold text-[#222] mb-2">
                      File Information
                    </Text>
                    <Text className="text-sm text-[#666] font-karla">
                      Original name: {selectedFile.fileName}
                    </Text>
                    <Text className="text-sm text-[#666] font-karla">
                      Size: {formatFileSize(selectedFile.fileSize)}
                    </Text>
                    {selectedFile.downloadCount > 0 && (
                      <Text className="text-sm text-[#666] font-karla">
                        Downloads: {selectedFile.downloadCount}
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View className="px-6 pb-6 pt-4 bg-white border-t border-gray-200">
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={actionLoading || !editDisplayName.trim()}
                  className={`rounded-xl py-4 mb-3 ${
                    actionLoading || !editDisplayName.trim()
                      ? "bg-gray-300"
                      : "bg-[#6C63FF]"
                  }`}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-center font-karla-bold text-white text-lg">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  disabled={actionLoading}
                  className="bg-gray-200 rounded-xl py-4"
                >
                  <Text className="text-center font-karla-bold text-[#222] text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* PDF Modal (in-app viewer) */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedPdf(null);
          }}
        >
          <View className="flex-1 bg-black">
            <TouchableOpacity
              className="absolute top-12 right-6 z-50"
              onPress={() => {
                setModalVisible(false);
                setSelectedPdf(null);
              }}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>

            {selectedPdf && (
              <View className="flex-1 w-full">
                <Pdf
                  source={{ uri: selectedPdf, cache: true }}
                  style={{ flex: 1, width: "100%" }}
                  onError={(error) => {
                    console.error("PDF Error:", error);
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
      </LinearGradient>
    </SafeAreaView>
  );
}
