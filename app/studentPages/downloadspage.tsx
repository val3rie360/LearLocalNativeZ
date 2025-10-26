import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";
import { useAuth } from "../../contexts/AuthContext";
import OfflineFileManager from "../../services/offlineFileManager";

interface OfflineFile {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  organizationName: string;
  downloadedAt: Date;
  lastAccessedAt: Date;
  cloudinaryId?: string;
  description?: string;
  category?: string;
}

const FileCard = ({
  file,
  onPress,
  onDelete,
}: {
  file: OfflineFile;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 m-2 flex-1 min-w-[140px] max-w-[48%] shadow-md"
      activeOpacity={0.8}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="w-[48px] h-[48px] bg-[#E5E7EB] rounded-lg items-center justify-center">
          <Ionicons name="document-text" size={24} color="#6C63FF" />
        </View>
        <TouchableOpacity
          onPress={onDelete}
          className="p-1"
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <Text
        className="text-[15px] font-karla-bold text-[#222] mb-1 text-center"
        numberOfLines={2}
      >
        {file.title}
      </Text>
      
      <Text className="text-xs text-[#888] text-center font-karla mb-1">
        {formatDate(file.downloadedAt)}
      </Text>
      
      <Text className="text-xs text-[#888] text-center font-karla">
        {formatFileSize(file.fileSize)}
      </Text>
      
      {file.organizationName && file.organizationName !== "Organization" && (
        <Text className="text-xs text-[#6C63FF] text-center font-karla mt-1" numberOfLines={1}>
          by {file.organizationName}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default function DownloadsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [offlineFiles, setOfflineFiles] = useState<OfflineFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    limit: 0,
    percentage: 0,
    filesCount: 0
  });

  // Load offline files
  const loadOfflineFiles = async () => {
    try {
      setLoading(true);
      const files = await OfflineFileManager.getOfflineFiles();
      setOfflineFiles(files);
      
      // Get storage info
      const info = await OfflineFileManager.getStorageInfo();
      setStorageInfo(info);
      
      console.log(`📱 Loaded ${files.length} offline files`);
    } catch (error) {
      console.error("Error loading offline files:", error);
      Alert.alert("Error", "Failed to load offline files.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file open
  const handleFileOpen = async (file: OfflineFile) => {
    try {
      const filePath = await OfflineFileManager.openFile(file);
      setSelectedPdf(filePath);
      setModalVisible(true);
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file. It may have been deleted.");
      // Refresh the list in case file was deleted
      await loadOfflineFiles();
    }
  };

  // Handle file delete
  const handleFileDelete = async (file: OfflineFile) => {
    Alert.alert(
      "Delete File",
      `Are you sure you want to delete "${file.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await OfflineFileManager.deleteOfflineFile(file.id);
              await loadOfflineFiles();
              Alert.alert("Success", "File deleted successfully.");
            } catch (error) {
              console.error("Error deleting file:", error);
              Alert.alert("Error", "Failed to delete file.");
            }
          },
        },
      ]
    );
  };

  // Handle clear all files
  const handleClearAll = () => {
    Alert.alert(
      "Clear All Files",
      "Are you sure you want to delete all offline files? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await OfflineFileManager.clearAllOfflineFiles();
              await loadOfflineFiles();
              Alert.alert("Success", "All offline files have been deleted.");
            } catch (error) {
              console.error("Error clearing files:", error);
              Alert.alert("Error", "Failed to clear files.");
            }
          },
        },
      ]
    );
  };

  // Filter files based on search query
  const filteredFiles = offlineFiles.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (file.category && file.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    loadOfflineFiles();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top"]}>
      <View className="flex-1 bg-[#F6F4FE] px-5 pt-5">
        {/* Header */}
        <View className="flex-col mb-3.5">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather
              name="arrow-left"
              size={24}
              color="#222"
              style={{ marginTop: 5 }}
            />
          </TouchableOpacity>
          <Text className="text-[28px] text-[#222] font-karla-bold mt-2">
            Offline Files
          </Text>
        </View>

        {/* Storage Info */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[16px] font-karla-bold text-[#111827]">
              Storage Usage
            </Text>
            <Text className="text-[13px] text-[#6B7280] font-karla">
              {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.limit)}
            </Text>
          </View>
          <View className="w-full bg-[#E5E7EB] rounded-full h-2 mb-2">
            <View 
              className="bg-[#4B1EB4] h-2 rounded-full" 
              style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-[#6B7280] font-karla">
              {storageInfo.filesCount} files downloaded
            </Text>
            {storageInfo.filesCount > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                className="px-3 py-1 bg-red-100 rounded-lg"
              >
                <Text className="text-[12px] text-red-600 font-karla-bold">
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white rounded-3xl px-4 h-11 mb-4.5 border border-[#ECECEC]">
          <Feather name="search" size={18} color="#000000ff" className="mr-2" />
          <TextInput
            className="flex-1 text-[15px] text-[#222] font-karla"
            placeholder="Search downloaded files..."
            placeholderTextColor="#B0B0B0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View className="h-px bg-[#ECECEC] w-full my-2" />

        {/* Section Title */}
        <View className="flex-row items-center justify-between mb-2 mt-2">
          <Text className="text-[18px] font-karla-bold text-[#222]">
            Your files
          </Text>
          <Text className="text-[13px] text-[#6B7280] font-karla">
            {filteredFiles.length} {filteredFiles.length === 1 ? "file" : "files"}
          </Text>
        </View>

        {/* Files Grid */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4B1EB4" />
            <Text className="text-[#666] mt-4 font-karla">Loading files...</Text>
          </View>
        ) : filteredFiles.length > 0 ? (
          <FlatList
            data={filteredFiles}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <FileCard
                file={item}
                onPress={() => handleFileOpen(item)}
                onDelete={() => handleFileDelete(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text className="text-[#666] font-karla-bold text-[18px] mt-4 text-center">
              {searchQuery ? "No files found" : "No downloaded files"}
            </Text>
            <Text className="text-[#999] font-karla text-center mt-2">
              {searchQuery 
                ? "Try adjusting your search terms"
                : "Download files from the Library to access them offline"
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/Library")}
                className="mt-4 px-6 py-3 bg-[#4B1EB4] rounded-lg"
              >
                <Text className="text-white font-karla-bold">Go to Library</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* PDF Viewer Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between p-4 bg-black">
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setSelectedPdf(null);
              }}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-karla-bold text-[16px] flex-1 text-center mr-8">
              Document Viewer
            </Text>
          </View>

          {selectedPdf && (
            <View className="flex-1 w-full">
              <Pdf
                source={{ uri: selectedPdf, cache: true }}
                style={{ flex: 1, width: "100%" }}
                onError={(error) => {
                  console.error("PDF Error:", error);
                  Alert.alert(
                    "PDF Error",
                    "Failed to load PDF. The file may be corrupted."
                  );
                }}
                onLoadComplete={(numberOfPages) => {
                  console.log(`PDF loaded with ${numberOfPages} pages`);
                }}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
