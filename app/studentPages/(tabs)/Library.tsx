import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
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
  downloadFile,
  formatFileSize,
  getAllActiveUploads,
} from "../../../services/cloudinaryUploadService";
import OfflineFileManager from "../../../services/offlineFileManager";
import {
  addBookmark,
  removeBookmark,
} from "../../../services/firestoreService";

const CategoryTag = ({ label }: { label: string }) => (
  <View className="bg-[#E5E7EB] rounded-[10px] px-2 py-0.5 mr-1.5 mb-1">
    <Text className="text-[11px] font-karla-bold text-[#374151]">{label}</Text>
  </View>
);

const Library = () => {
  const { user, profileData, refreshProfile } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "bookmarked" | "new" | "popular"
  >("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadedResources, setDownloadedResources] = useState<any[]>([]);
  const [offlineFiles, setOfflineFiles] = useState<any[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Get organization name with fallbacks
  const getOrganizationName = (item: any): string =>
    item?.organizationProfile?.name ??
    item?.organizationName ??
    item?.organization?.name ??
    "Organization";

  // Load offline files
  const loadOfflineFiles = async () => {
    try {
      const files = await OfflineFileManager.getOfflineFiles();
      setOfflineFiles(files);
      console.log(`📱 Loaded ${files.length} offline files`);
    } catch (error) {
      console.error("Error loading offline files:", error);
    }
  };

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getAllActiveUploads();
      console.log("Fetched resources:", data.length);
      setResources(data);
      setFilteredResources(data);

      // Load user's bookmarked and downloaded IDs from profile
      if (user?.uid && profileData) {
        const bookmarksRaw = (profileData as any).bookmarkedResources;
        const downloadsRaw = (profileData as any).downloadedResources;
        setBookmarkedIds(Array.isArray(bookmarksRaw) ? bookmarksRaw : []);
        setDownloadedIds(Array.isArray(downloadsRaw) ? downloadsRaw : []);
      }

      // Load offline files
      await loadOfflineFiles();
    } catch (error) {
      console.error("Error fetching resources:", error);
      Alert.alert("Error", "Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user?.uid, profileData]);

  // Update downloaded resources list
  useEffect(() => {
    // Only show offline files in downloaded resources section
    const offlineFileIds = offlineFiles.map(file => file.id);
    const offlineResources = resources.filter((item) =>
      offlineFileIds.includes(item.id)
    );
    setDownloadedResources(offlineResources);
  }, [offlineFiles, resources]);

  // Filter and search resources
  useEffect(() => {
    let result = [...resources];

    // Apply bookmarked filter
    if (selectedFilter === "bookmarked") {
      result = result.filter((resource) => bookmarkedIds.includes(resource.id));
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((resource) => {
        const titleMatch =
          resource.displayName?.toLowerCase()?.includes(searchLower) ||
          resource.fileName?.toLowerCase()?.includes(searchLower);
        const descMatch = resource.description
          ?.toLowerCase()
          ?.includes(searchLower);
        const categoryMatch = resource.category
          ?.toLowerCase()
          ?.includes(searchLower);
        const tagMatch =
          Array.isArray(resource.tags) &&
          resource.tags.some(
            (tag: any) =>
              typeof tag === "string" && tag.toLowerCase().includes(searchLower)
          );
        const orgMatch = getOrganizationName(resource)
          ?.toLowerCase()
          ?.includes(searchLower);

        return titleMatch || descMatch || categoryMatch || tagMatch || orgMatch;
      });
    }

    // Apply other category filters
    if (selectedFilter === "new") {
      // Show resources from last 7 days (less than 1 week old)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0); // Start of day 7 days ago

      result = result.filter((resource) => {
        const createdAt =
          resource.createdAt?.toDate?.() || new Date(resource.createdAt);
        return createdAt > oneWeekAgo; // Strictly less than 1 week
      });
    } else if (selectedFilter === "popular") {
      // Sort by download count
      result = result.sort(
        (a, b) => (b.downloadCount || 0) - (a.downloadCount || 0)
      );
    }

    setFilteredResources(result);
  }, [searchQuery, selectedFilter, resources, bookmarkedIds, downloadedIds]);

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  // Handle file download & open inside app
  const handleDownload = async (resource: any) => {
    try {
      setDownloadingFileId(resource.id);
      
      // Check if file is already downloaded for offline access
      const isOffline = await OfflineFileManager.isFileDownloaded(resource.id);
      
      if (isOffline) {
        // File is already downloaded, open it directly
        console.log("📱 Opening offline file:", resource.title);
        const offlineFiles = await OfflineFileManager.getOfflineFiles();
        const offlineFile = offlineFiles.find(f => f.id === resource.id);
        
        if (offlineFile) {
          const filePath = await OfflineFileManager.openFile(offlineFile);
          setSelectedPdf(filePath);
          setModalVisible(true);
        } else {
          throw new Error("Offline file not found");
        }
      } else {
        // Download file for offline access
        console.log("🔄 Downloading file for offline access:", resource.title);
        
        // Get download URL
        const url = await downloadFile(resource.id, user?.uid);
        if (!url) throw new Error("No download URL returned");

        // Download and save for offline access
        const offlineFile = await OfflineFileManager.downloadFileForOffline(
          resource,
          url,
          user?.uid || ""
        );

        // Open the downloaded file
        const filePath = await OfflineFileManager.openFile(offlineFile);
        setSelectedPdf(filePath);
        setModalVisible(true);
        
        // Refresh offline files list
        await loadOfflineFiles();
        
        Alert.alert(
          "Download Complete", 
          `${resource.title} has been downloaded for offline access.`
        );
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      Alert.alert("Error", "Failed to download or open file. Try again.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (resourceId: string) => {
    if (!user?.uid) {
      Alert.alert("Error", "You must be logged in to bookmark resources.");
      return;
    }

    try {
      const isBookmarked = bookmarkedIds.includes(resourceId);

      if (isBookmarked) {
        // Remove bookmark
        await removeBookmark(user.uid, resourceId);
        setBookmarkedIds((prev) => prev.filter((id) => id !== resourceId));
        Alert.alert("Removed", "Resource removed from your library.");
      } else {
        // Add bookmark
        await addBookmark(user.uid, resourceId);
        setBookmarkedIds((prev) => [...prev, resourceId]);
        Alert.alert("Saved", "Resource added to your library!");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark. Please try again.");
    }
  };

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchResources();
  };

  // Get color for resource based on category
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Math: "#F87171",
      Science: "#4ADEDE",
      English: "#FBBF24",
      History: "#A78BFA",
      Arts: "#FB923C",
      Technology: "#34D399",
      default: "#6366F1",
    };

    const categoryLower =
      typeof category === "string" ? category.toLowerCase() : "";
    for (const key in colors) {
      if (key !== "default" && categoryLower.includes(key.toLowerCase())) {
        return colors[key];
      }
    }
    return colors.default;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1 bg-[#F6F4FE] px-5 pt-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Text className="text-[25px] font-karla-bold text-[#111827] mb-2">
          Learning Library
        </Text>
        <Text className="text-[14px] font-karla text-[#6B7280] mb-4">
          Find free worksheets, modules, and study packs from trusted local
          organizations.
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-3xl px-4 h-11 mb-2 border border-[#E5E0FF]">
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            className="flex-1 ml-2 text-[15px] text-[#222] font-karla"
            placeholder="Search resources..."
            placeholderTextColor="#B0B0B0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <View className="h-[1px] bg-[#E5E0FF] mt-1 mb-4" />

        {/* Downloaded Resources - Horizontal Scroll (only on All tab) */}
        {!loading &&
          downloadedResources.length > 0 &&
          selectedFilter === "all" && (
            <View className="mb-5">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-[16px] font-karla-bold text-[#111827]">
                  Offline Resources
                </Text>
                <Text className="text-[13px] text-[#6B7280] font-karla">
                  {downloadedResources.length}{" "}
                  {downloadedResources.length === 1 ? "file" : "files"} available offline
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
              >
                {downloadedResources.slice(0, 10).map((item) => {
                  const isBookmarked = bookmarkedIds.includes(item.id);

                  return (
                    <View
                      key={`downloaded-horiz-${item.id}`}
                      className="bg-white rounded-xl p-3 mr-3 shadow-sm w-[280px]"
                      style={{ elevation: 2 }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          zIndex: 1,
                        }}
                        className="flex-row items-center"
                      >
                        <TouchableOpacity
                          onPress={() => handleBookmarkToggle(item.id)}
                          className="mr-2 p-1 bg-white rounded-full"
                          activeOpacity={0.7}
                          style={{ elevation: 2 }}
                        >
                          <Ionicons
                            name={
                              isBookmarked ? "bookmark" : "bookmark-outline"
                            }
                            size={18}
                            color={isBookmarked ? "#6C3EF8" : "#4B1EB4"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDownload(item)}
                          className="p-1 bg-white rounded-full"
                          activeOpacity={0.7}
                          style={{ elevation: 2 }}
                          disabled={downloadingFileId === item.id}
                        >
                          {downloadingFileId === item.id ? (
                            <ActivityIndicator size="small" color="#4B1EB4" />
                          ) : (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#10B981"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDownload(item)}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center mb-2">
                          <View
                            className="w-[45px] h-[45px] rounded-lg mr-3 items-center justify-center"
                            style={{
                              backgroundColor: getCategoryColor(item.category),
                            }}
                          >
                            <Ionicons
                              name="document-text"
                              size={22}
                              color="#fff"
                            />
                          </View>
                          <View className="flex-1 pr-8">
                            <Text
                              className="text-[15px] font-karla-bold text-[#111827] mb-0.5"
                              numberOfLines={2}
                            >
                              {item.displayName || item.fileName}
                            </Text>
                            {getOrganizationName(item) !== "Organization" && (
                              <Text
                                className="text-[10px] font-karla text-[#9333EA]"
                                numberOfLines={1}
                              >
                                by {getOrganizationName(item)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-row flex-wrap mb-2">
                          <CategoryTag label={item.category || "General"} />
                          {Array.isArray(item.tags)
                            ? item.tags
                                .filter(
                                  (tag: any) =>
                                    typeof tag === "string" &&
                                    tag !== item.category
                                )
                                .filter(
                                  (
                                    tag: string,
                                    index: number,
                                    self: string[]
                                  ) => self.indexOf(tag) === index
                                )
                                .slice(0, 2)
                                .map((tag: string, idx: number) => (
                                  <CategoryTag key={idx} label={tag} />
                                ))
                            : null}
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-[11px] font-karla text-[#10B981]">
                            📱 Available Offline • {formatFileSize(item.fileSize)}
                          </Text>
                          <View className="flex-row items-center">
                            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                            <Text className="text-[10px] font-karla-bold text-[#10B981] ml-1">
                              Offline
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          <TouchableOpacity
            className={`py-1.5 px-4 rounded-full mr-2.5 ${selectedFilter === "all" ? "bg-[#6C3EF8]" : "bg-[#F3F4F6]"}`}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              className={`text-[14px] font-karla-bold ${selectedFilter === "all" ? "text-white" : "text-[#6B7280]"}`}
            >
              All ({resources.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-1.5 px-4 rounded-full mr-2.5 ${selectedFilter === "bookmarked" ? "bg-[#6C3EF8]" : "bg-[#F3F4F6]"}`}
            onPress={() => setSelectedFilter("bookmarked")}
          >
            <Text
              className={`text-[14px] font-karla-bold ${selectedFilter === "bookmarked" ? "text-white" : "text-[#6B7280]"}`}
            >
              My Library ({bookmarkedIds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-1.5 px-4 rounded-full mr-2.5 ${selectedFilter === "new" ? "bg-[#6C3EF8]" : "bg-[#F3F4F6]"}`}
            onPress={() => setSelectedFilter("new")}
          >
            <Text
              className={`text-[14px] font-karla-bold ${selectedFilter === "new" ? "text-white" : "text-[#6B7280]"}`}
            >
              New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-1.5 px-4 rounded-full ${selectedFilter === "popular" ? "bg-[#6C3EF8]" : "bg-[#F3F4F6]"}`}
            onPress={() => setSelectedFilter("popular")}
          >
            <Text
              className={`text-[14px] font-karla-bold ${selectedFilter === "popular" ? "text-white" : "text-[#6B7280]"}`}
            >
              Popular
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Downloaded sub-tab removed */}

        {/* Resources List */}
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#6C3EF8" />
            <Text className="text-[#666] mt-3 font-karla">
              Loading resources...
            </Text>
          </View>
        ) : filteredResources.length > 0 ? (
          <>
            {/* My Library - Show Selected Sub-Tab Section in Columns */}
            {selectedFilter === "bookmarked" ? (
              <>
                {/* Saved Resources Section */}
                {(() => {
                  const savedItems = filteredResources.filter(
                    (item) =>
                      item &&
                      item.id &&
                      bookmarkedIds.includes(item.id) &&
                      (item.displayName || item.fileName) // Ensure item has a name
                  );

                  return savedItems.length > 0 ? (
                    <View className="mb-5">
                      <View className="flex-row justify-between items-center mb-2.5">
                        <Text className="text-[16px] font-karla-bold text-[#111827]">
                          Saved Resources
                        </Text>
                        <Text className="text-[13px] text-[#6B7280] font-karla">
                          {savedItems.length}{" "}
                          {savedItems.length === 1 ? "file" : "files"}
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap justify-between">
                        {savedItems.map((item) => {
                          const isBookmarked = true; // Always true in this section

                          return (
                            <View
                              key={`saved-${item.id}`}
                              className="bg-white rounded-xl p-3 mb-3 shadow-sm"
                              style={{
                                elevation: 2,
                                position: "relative",
                                width: "48%",
                              }}
                            >
                              <View
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  zIndex: 1,
                                }}
                                className="flex-row items-center"
                              >
                                <TouchableOpacity
                                  onPress={() => handleBookmarkToggle(item.id)}
                                  className="mr-1 p-0.5"
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="bookmark"
                                    size={16}
                                    color="#6C3EF8"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleDownload(item)}
                                  className="p-0.5"
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="download-outline"
                                    size={16}
                                    color="#4B1EB4"
                                  />
                                </TouchableOpacity>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleDownload(item)}
                                activeOpacity={0.7}
                                className="items-center pt-4"
                              >
                                <View
                                  className="w-[55px] h-[55px] rounded-lg mb-2 items-center justify-center"
                                  style={{
                                    backgroundColor: getCategoryColor(
                                      item.category
                                    ),
                                  }}
                                >
                                  <Ionicons
                                    name="document-text"
                                    size={26}
                                    color="#fff"
                                  />
                                </View>
                                <Text
                                  className="text-[13px] font-karla-bold text-[#111827] mb-1 text-center px-1"
                                  numberOfLines={2}
                                >
                                  {item.displayName || item.fileName}
                                </Text>
                                {getOrganizationName(item) !== "Organization" && (
                                  <Text
                                    className="text-[9px] font-karla text-[#9333EA] mb-1 text-center"
                                    numberOfLines={1}
                                  >
                                    by {getOrganizationName(item)}
                                  </Text>
                                )}
                                <View className="flex-row flex-wrap justify-center mb-1">
                                  <View className="bg-[#E5E7EB] rounded-[8px] px-1.5 py-0.5">
                                    <Text className="text-[9px] font-karla-bold text-[#374151]">
                                      {item.category || "General"}
                                    </Text>
                                  </View>
                                </View>
                                <Text className="text-[10px] font-karla text-[#6B7280] text-center">
                                  {formatFileSize(item.fileSize)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View className="py-12 items-center px-8">
                      <Ionicons
                        name="bookmark-outline"
                        size={64}
                        color="#CCC"
                      />
                      <Text className="text-[#666] font-karla-bold text-[16px] mt-3 text-center">
                        No saved resources yet
                      </Text>
                      <Text className="text-[#999] font-karla text-[13px] mt-1 text-center">
                        Bookmark resources to save them for later
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              /* Other Filters - Regular List */
              <>
                <View className="flex-row justify-between items-center mb-2.5">
                  <Text className="text-[16px] font-karla-bold text-[#111827]">
                    {selectedFilter === "all"
                      ? "All Resources"
                      : selectedFilter === "new"
                        ? "New This Week"
                        : "Popular Resources"}
                  </Text>
                  <Text className="text-[13px] text-[#6B7280] font-karla">
                    {filteredResources.length}{" "}
                    {filteredResources.length === 1 ? "file" : "files"}
                  </Text>
                </View>
                {filteredResources.map((item) => {
                  const isBookmarked = bookmarkedIds.includes(item.id);

                  return (
                    <View
                      key={item.id}
                      className="bg-white rounded-xl p-3 mb-3 shadow-sm"
                      style={{ elevation: 2, position: "relative" }}
                    >
                      {/* Action buttons in upper right */}
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          zIndex: 1,
                        }}
                        className="flex-row items-center"
                      >
                        {/* Bookmark button */}
                        <TouchableOpacity
                          onPress={() => handleBookmarkToggle(item.id)}
                          className="mr-2 p-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={
                              isBookmarked ? "bookmark" : "bookmark-outline"
                            }
                            size={20}
                            color={isBookmarked ? "#6C3EF8" : "#4B1EB4"}
                          />
                        </TouchableOpacity>

                        {/* Download button */}
                        <TouchableOpacity
                          onPress={() => handleDownload(item)}
                          className="p-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="download-outline"
                            size={20}
                            color="#4B1EB4"
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDownload(item)}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-[50px] h-[50px] rounded-lg mr-3 items-center justify-center"
                            style={{
                              backgroundColor: getCategoryColor(item.category),
                            }}
                          >
                            <Ionicons
                              name="document-text"
                              size={24}
                              color="#fff"
                            />
                          </View>
                          <View className="flex-1 pr-12">
                            <Text
                              className="text-[15px] font-karla-bold text-[#111827] mb-1"
                              numberOfLines={2}
                            >
                              {item.displayName || item.fileName}
                            </Text>

                            {/* Organization name */}
                            {getOrganizationName(item) !== "Organization" && (
                              <Text className="text-[11px] font-karla text-[#9333EA] mb-1">
                                by {getOrganizationName(item)}
                              </Text>
                            )}

                            <View className="flex-row flex-wrap mb-1">
                              <CategoryTag label={item.category || "General"} />
                              {Array.isArray(item.tags)
                                ? item.tags
                                    .filter(
                                      (tag: any) =>
                                        typeof tag === "string" &&
                                        tag !== item.category
                                    ) // Remove category from tags
                                    .filter(
                                      (
                                        tag: string,
                                        index: number,
                                        self: string[]
                                      ) => self.indexOf(tag) === index
                                    ) // Remove duplicates
                                    .slice(0, 2)
                                    .map((tag: string, idx: number) => (
                                      <CategoryTag key={idx} label={tag} />
                                    ))
                                : null}
                            </View>

                            <View className="flex-row items-center justify-between">
                              <Text className="text-[12px] font-karla text-[#6B7280]">
                                {formatDate(item.createdAt)} •{" "}
                                {formatFileSize(item.fileSize)}
                              </Text>
                              {item.downloadCount > 0 && (
                                <Text className="text-[11px] font-karla-bold text-[#6C3EF8]">
                                  {item.downloadCount} downloads
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}
          </>
        ) : (
          <View className="py-12 items-center px-8">
            <Ionicons
              name={
                selectedFilter === "bookmarked"
                  ? "bookmark-outline"
                  : "folder-open-outline"
              }
              size={64}
              color="#CCC"
            />
            <Text className="text-[#666] font-karla-bold text-[16px] mt-3 text-center">
              {selectedFilter === "bookmarked"
                ? "No bookmarked resources yet"
                : searchQuery
                  ? "No resources found"
                  : "No resources available yet"}
            </Text>
            <Text className="text-[#999] font-karla text-center mt-1">
              {selectedFilter === "bookmarked"
                ? "Tap the bookmark icon on resources to save them here"
                : searchQuery
                  ? "Try a different search term"
                  : "Check back later for learning materials"}
            </Text>
          </View>
        )}
      </ScrollView>

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
    </SafeAreaView>
  );
};

export default Library;
