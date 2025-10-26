import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";
import {
  deleteOpportunity,
  getOpportunityDetails,
  getOrganizationOpportunities,
} from "../../../services/firestoreService";

interface ProfileData {
  name?: string;
  email?: string;
  role?: "student" | "organization";
  createdAt?: {
    seconds: number;
  };
  verificationFileUrl?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  profileImageUrl?: string;
  profilePictureUrl?: string;
  photoURL?: string;
}

export default function OrgHome() {
  const { user, profileData, profileLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editDateMilestones, setEditDateMilestones] = useState<
    Array<{ name: string; date: string }>
  >([]);
  const [editLocation, setEditLocation] = useState<any>(null);
  const [editOpenTime, setEditOpenTime] = useState("");
  const [editCloseTime, setEditCloseTime] = useState("");
  const [editWorkshopStarts, setEditWorkshopStarts] = useState("");
  const [editWorkshopEnds, setEditWorkshopEnds] = useState("");
  const [editRepeats, setEditRepeats] = useState(false);
  const [editSelectedDays, setEditSelectedDays] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [milestoneDateObj, setMilestoneDateObj] = useState<Date | null>(null);

  // Fetch opportunities function
  const fetchOpportunities = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedOpportunities = await getOrganizationOpportunities(user.uid);
      setOpportunities(fetchedOpportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      Alert.alert("Error", "Failed to load opportunities");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Refresh opportunities whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOpportunities();
    }, [fetchOpportunities])
  );

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (profileLoading) return "Organization";
    return (
      profileData?.name ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "Organization"
    );
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Scholarship / Grant":
        return <FontAwesome6 name="scroll" size={20} color="#4B1EB4" />;
      case "Competition / Event":
        return <FontAwesome6 name="medal" size={20} color="#4B1EB4" />;
      case "Workshop / Seminar":
        return (
          <FontAwesome5 name="chalkboard-teacher" size={20} color="#4B1EB4" />
        );
      case "Study Spot":
        return <Ionicons name="location" size={21} color="#4B1EB4" />;
      case "Resources":
        return (
          <MaterialCommunityIcons name="bookshelf" size={24} color="#4B1EB4" />
        );
      default:
        return <FontAwesome6 name="scroll" size={20} color="#4B1EB4" />;
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle delete
  const handleDelete = (opportunityId: string, specificCollection: string) => {
    Alert.alert(
      "Delete Opportunity",
      "Are you sure you want to delete this opportunity? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteOpportunity(opportunityId, specificCollection);
              // Refresh the list after deletion
              fetchOpportunities();
              Alert.alert("Success", "Opportunity deleted successfully");
            } catch (error) {
              console.error("Error deleting opportunity:", error);
              Alert.alert("Error", "Failed to delete opportunity");
            }
          },
        },
      ]
    );
  };

  // Handle view details
  const handleViewDetails = async (opportunity: any) => {
    try {
      const fullDetails = await getOpportunityDetails(
        opportunity.id,
        opportunity.specificCollection
      );
      setSelectedOpportunity(fullDetails);
      setDetailsModalVisible(true);
    } catch (error) {
      console.error("Error fetching opportunity details:", error);
      Alert.alert("Error", "Failed to load opportunity details");
    }
  };

  // Handle edit
  const handleEdit = async (opportunity: any) => {
    try {
      const fullDetails: any = await getOpportunityDetails(
        opportunity.id,
        opportunity.specificCollection
      );
      setEditingOpportunity(fullDetails);
      setEditTitle(fullDetails.title || "");
      setEditDescription(fullDetails.description || "");
      setEditAmount(fullDetails.amount || "");
      setEditStatus(fullDetails.status || "active");
      setEditDateMilestones(fullDetails.dateMilestones || []);
      setEditLocation(fullDetails.location || null);
      setEditOpenTime(fullDetails.openTime || "");
      setEditCloseTime(fullDetails.closeTime || "");
      setEditWorkshopStarts(fullDetails.workshopStarts || "");
      setEditWorkshopEnds(fullDetails.workshopEnds || "");
      setEditRepeats(fullDetails.repeats || false);
      setEditSelectedDays(fullDetails.selectedDays || []);
      setEditModalVisible(true);
    } catch (error) {
      console.error("Error fetching opportunity for edit:", error);
      Alert.alert("Error", "Failed to load opportunity details");
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert("Error", "Please fill in title and description");
      return;
    }

    // Validate milestones for Scholarship/Competition
    if (
      (editingOpportunity.category === "Scholarship / Grant" ||
        editingOpportunity.category === "Competition / Event") &&
      editDateMilestones.length === 0
    ) {
      Alert.alert("Error", "Please add at least one date milestone");
      return;
    }

    if (!editingOpportunity) return;

    setIsSaving(true);

    try {
      const { updateOpportunity } = await import(
        "../../../services/firestoreService"
      );

      const updateData: any = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        status: editStatus,
      };

      // Update amount for scholarships/competitions
      if (
        editAmount &&
        (editingOpportunity.category === "Scholarship / Grant" ||
          editingOpportunity.category === "Competition / Event")
      ) {
        updateData.amount = editAmount.trim();
      }

      // Update milestones for scholarships/competitions
      if (
        editingOpportunity.category === "Scholarship / Grant" ||
        editingOpportunity.category === "Competition / Event"
      ) {
        updateData.dateMilestones = editDateMilestones;
      }

      // Update location for study spots and workshops
      if (
        editLocation &&
        (editingOpportunity.category === "Study Spot" ||
          editingOpportunity.category === "Workshop / Seminar")
      ) {
        updateData.location = editLocation;
      }

      // Update hours for study spots
      if (editingOpportunity.category === "Study Spot") {
        updateData.openTime = editOpenTime;
        updateData.closeTime = editCloseTime;
      }

      // Update schedule for workshops
      if (editingOpportunity.category === "Workshop / Seminar") {
        updateData.workshopStarts = editWorkshopStarts;
        updateData.workshopEnds = editWorkshopEnds;
        updateData.repeats = editRepeats;
        if (editRepeats) {
          updateData.selectedDays = editSelectedDays;
        }
      }

      await updateOpportunity(
        editingOpportunity.id,
        editingOpportunity.specificCollection ||
          opportunities.find((o) => o.id === editingOpportunity.id)
            ?.specificCollection,
        updateData
      );

      // Refresh the list
      await fetchOpportunities();

      setEditModalVisible(false);
      setEditingOpportunity(null);
      Alert.alert("Success", "Opportunity updated successfully!");
    } catch (error) {
      console.error("Error updating opportunity:", error);
      Alert.alert("Error", "Failed to update opportunity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for edit modal
  const addEditMilestone = (name: string, date: string) => {
    if (name.trim() && date.trim()) {
      setEditDateMilestones([
        ...editDateMilestones,
        { name: name.trim(), date: date.trim() },
      ]);
    }
  };

  const removeEditMilestone = (index: number) => {
    setEditDateMilestones(editDateMilestones.filter((_, i) => i !== index));
  };

  const toggleEditDay = (day: string) => {
    setEditSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (opp.category === "Resources") return false;

    const matchesSearch = opp.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || opp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const typedProfile = (profileData ?? {}) as ProfileData;
  const isVerified = typedProfile?.verificationStatus === "verified";
  const profileImageUri =
    typedProfile?.profileImageUrl ||
    typedProfile?.profilePictureUrl ||
    typedProfile?.photoURL ||
    user?.photoURL ||
    null;

  return (
    <SafeAreaView
      className="flex-1 bg-[#D6D3FF] "
      edges={["top", "left", "right"]}
    >
      <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4B1EB4"]}
              tintColor="#4B1EB4"
            />
          }
        >
          {/* Gradient Header (lighter purple) */}
          <LinearGradient
            colors={["#D6D3FF", "#4d2adaa1", "#4d2adaff"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 130,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              zIndex: 0,
            }}
          />
          {/* Avatar and Org Name */}
          <View className="items-center mt-24 mb-2">
            <View
              className="bg-white rounded-full w-24 h-24 items-center justify-center border-4 border-[#ECEAFF] shadow"
              style={{ elevation: 0, overflow: "hidden" }}
            >
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <FontAwesome name="users" size={56} color="#7D7CFF" />
              )}
            </View>
            <View className="flex-row items-center mt-2">
              <Text className="text-white text-lg font-karla-bold">
                {getDisplayName()}
              </Text>
              {isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#60ecffff"
                  style={{ marginLeft: 6 }}
                />
              )}
            </View>
            {!isVerified && (
              <Text
                className="mt-1 text-sm text-red-500 font-karla-bold text-center px-6"
                style={{ textDecorationLine: "underline" }}
              >
                NOTE: Your account is pending verification; your opportunities
                are temporarily hidden from students.
              </Text>
            )}
          </View>
          {/* Search Bar & Icon Row */}
          <View className="mx-4 mt-2">
            <View className="bg-white rounded-2xl px-4 py-2 shadow border border-[#C9BFFF] mb-4">
              {/* Icon and Search Bar Row */}
              <View className="flex-row items-center">
                <View style={{ position: "relative" }}>
                  <View
                    className="w-9 h-9 rounded-full bg-[#D6D3FF] items-center justify-center mr-3"
                    style={{ overflow: "hidden" }}
                  >
                    {profileImageUri ? (
                      <Image
                        source={{ uri: profileImageUri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderColor: "#cfcbf663",
                          borderRadius: 48,
                          borderWidth: 2,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <FontAwesome name="users" size={22} color="#7D7CFF" />
                    )}
                  </View>
                  {isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#60ecffff"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 10,
                        backgroundColor: "#fff",
                        borderRadius: 7,
                      }}
                    />
                  )}
                </View>
                <View className="flex-row flex-1 items-center bg-[#F7F7F8] rounded-3xl px-4 h-11 mb-4.5 border border-[#ECECEC]">
                  <TextInput
                    className="flex-1 text-[15px] text-[#222] font-karla"
                    placeholder="Search opportunities..."
                    placeholderTextColor="#B0B0B0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              {/* Categories Row */}
              <View className="flex-row justify-end mt-1.5 mb-1 px-2">
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === "Scholarship / Grant"
                        ? null
                        : "Scholarship / Grant"
                    )
                  }
                >
                  <FontAwesome6
                    name="scroll"
                    size={19}
                    color={
                      selectedCategory === "Scholarship / Grant"
                        ? "#4B1EB4"
                        : "#57477cbd"
                    }
                    style={{ marginRight: 25 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === "Competition / Event"
                        ? null
                        : "Competition / Event"
                    )
                  }
                >
                  <FontAwesome6
                    name="medal"
                    size={20}
                    color={
                      selectedCategory === "Competition / Event"
                        ? "#4B1EB4"
                        : "#57477cbd"
                    }
                    style={{ marginRight: 25 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === "Workshop / Seminar"
                        ? null
                        : "Workshop / Seminar"
                    )
                  }
                >
                  <FontAwesome5
                    name="chalkboard-teacher"
                    size={20}
                    color={
                      selectedCategory === "Workshop / Seminar"
                        ? "#4B1EB4"
                        : "#57477cbd"
                    }
                    style={{ marginRight: 25 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === "Study Spot" ? null : "Study Spot"
                    )
                  }
                >
                  <Ionicons
                    name="location"
                    size={21}
                    color={
                      selectedCategory === "Study Spot"
                        ? "#4B1EB4"
                        : "#57477cbd"
                    }
                    style={{ marginRight: 25 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === "Resources" ? null : "Resources"
                    )
                  }
                >
                  <MaterialCommunityIcons
                    name="bookshelf"
                    size={24}
                    color={
                      selectedCategory === "Resources" ? "#4B1EB4" : "#57477cbd"
                    }
                    style={{ marginRight: 25 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Ionicons name="close-circle" size={20} color="#57477cbd" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* Loading State */}
          {loading && (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#4B1EB4" />
              <Text className="text-[#4B1EB4] font-karla mt-2">
                Loading opportunities...
              </Text>
            </View>
          )}
          {/* Empty State */}
          {!loading && filteredOpportunities.length === 0 && (
            <View className="flex-1 items-center justify-center py-20 px-8">
              <FontAwesome6 name="rocket" size={64} color="#D6D3FF" />
              <Text className="text-[#4B1EB4] text-2xl font-karla-bold mt-4 text-center">
                Let's Get Started!
              </Text>
              <Text className="text-gray-600 text-base font-karla mt-2 text-center">
                {opportunities.length === 0
                  ? "You haven't posted any opportunities yet. Tap the + button below to create your first opportunity!"
                  : "No opportunities match your search criteria."}
              </Text>
            </View>
          )}

          {/* Opportunities List */}
          {!loading &&
            filteredOpportunities.map((item) => (
              <View
                key={item.id}
                className="bg-[#ffffff] rounded-2xl mx-4 mb-5 p-4"
                style={{
                  shadowColor: "#7D7CFF",
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-9 h-9 rounded-full bg-[#D6D3FF] items-center justify-center mr-3"
                      style={{ position: "relative", overflow: "visible" }}
                    >
                      {profileImageUri ? (
                        <Image
                          source={{ uri: profileImageUri }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 48,
                            borderColor: "#cfcbf663",
                            borderWidth: 2,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <FontAwesome name="users" size={22} color="#7D7CFF" />
                      )}
                      {isVerified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#4BDBFF"
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: -2,
                            backgroundColor: "#fff",
                            borderRadius: 7,
                            zIndex: 10,
                          }}
                        />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="font-karla-bold text-black text-sm">
                          {getDisplayName()}
                        </Text>
                        <View className="ml-2">
                          {getCategoryIcon(item.category)}
                        </View>
                      </View>
                      <Text className="text-[#18181B] text-xs font-karla">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => handleViewDetails(item)}
                      className="mr-3"
                    >
                      <Ionicons name="eye" size={20} color="#4B1EB4" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEdit(item)}
                      className="mr-3"
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleDelete(item.id, item.specificCollection)
                      }
                    >
                      <Ionicons name="trash" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => handleViewDetails(item)}>
                  <Text className="font-karla-bold text-[#4B1EB4] text-base mb-2">
                    {item.title}
                  </Text>
                  <Text
                    className="text-gray-600 text-sm font-karla mb-3"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>

                  <View className="flex-row items-center">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        item.status === "active"
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-karla-bold ${
                          item.status === "active"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {item.status?.toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-karla-bold text-[#4B1EB4]">
                  Edit Opportunity
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#4B1EB4" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {editingOpportunity && (
                  <View>
                    {/* Category Display (Read-only) */}
                    <View className="mb-4">
                      <Text className="text-sm font-karla-bold text-gray-700 mb-1">
                        Category
                      </Text>
                      <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                        {getCategoryIcon(editingOpportunity.category)}
                        <Text className="font-karla text-gray-700 ml-2">
                          {editingOpportunity.category}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500 mt-1 font-karla">
                        Category cannot be changed after creation
                      </Text>
                    </View>

                    {/* Title */}
                    <View className="mb-4">
                      <Text className="text-sm font-karla-bold text-gray-700 mb-1">
                        Title *
                      </Text>
                      <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 font-karla text-base text-black"
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Enter title"
                      />
                    </View>

                    {/* Description */}
                    <View className="mb-4">
                      <Text className="text-sm font-karla-bold text-gray-700 mb-1">
                        Description *
                      </Text>
                      <TextInput
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 font-karlatext-base text-black"
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder="Enter description"
                        multiline
                        numberOfLines={4}
                        style={{ minHeight: 100, textAlignVertical: "top" }}
                      />
                    </View>

                    {/* Amount (only for scholarships/competitions) */}
                    {(editingOpportunity.category === "Scholarship / Grant" ||
                      editingOpportunity.category ===
                        "Competition / Event") && (
                      <View className="mb-4">
                        <Text className="text-sm font-karla-bold text-gray-700 mb-1">
                          Amount
                        </Text>
                        <TextInput
                          className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-black"
                          value={editAmount}
                          onChangeText={setEditAmount}
                          placeholder="Enter amount (e.g., $5000)"
                          keyboardType="default"
                        />
                      </View>
                    )}

                    {/* Date Milestones (for scholarships/competitions) */}
                    {(editingOpportunity.category === "Scholarship / Grant" ||
                      editingOpportunity.category ===
                        "Competition / Event") && (
                      <View className="mb-4">
                        <Text className="text-sm font-karla-bold text-gray-700 mb-2">
                          Date Milestones *
                        </Text>

                        {/* Display existing milestones */}
                        {editDateMilestones.map((milestone, index) => (
                          <View
                            key={index}
                            className="bg-purple-50 rounded-xl mb-2 px-3 py-2 flex-row items-center justify-between"
                          >
                            <View className="flex-1">
                              <Text className="text-sm font-karla-bold text-[#4B1EB4]">
                                {milestone.name}
                              </Text>
                              <Text className="text-xs text-gray-600">
                                {milestone.date}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => removeEditMilestone(index)}
                            >
                              <Ionicons
                                name="close-circle"
                                size={24}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}

                        {/* Add milestone button */}
                        <TouchableOpacity
                          className="bg-[#a084e8] rounded-lg py-3 items-center"
                          onPress={() => {
                            setNewMilestoneName("");
                            setNewMilestoneDate("");
                            setShowAddMilestoneModal(true);
                          }}
                        >
                          <Text className="text-gray-600 font-karla-bold">
                            + Add Milestone
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Location (for study spots and workshops) */}
                    {(editingOpportunity.category === "Study Spot" ||
                      editingOpportunity.category === "Workshop / Seminar") && (
                      <View className="mb-4">
                        <Text className="text-sm font-karla-bold text-gray-700 mb-2">
                          Location
                        </Text>
                        <View className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-3">
                          {editLocation ? (
                            <View>
                              <Text className="font-karla text-gray-700 mb-1">
                                📍 Location Selected
                              </Text>
                              <Text className="text-xs text-gray-600">
                                Lat: {editLocation.latitude?.toFixed(6)}
                              </Text>
                              <Text className="text-xs text-gray-600">
                                Long: {editLocation.longitude?.toFixed(6)}
                              </Text>
                              <TouchableOpacity
                                className="mt-2 bg-red-100 rounded-lg py-2"
                                onPress={() => setEditLocation(null)}
                              >
                                <Text className="text-center text-red-600 font-karla-bold">
                                  Remove Location
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Text className="text-gray-500 font-karla text-center">
                              Location editing requires map integration
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Study Spot Hours */}
                    {editingOpportunity.category === "Study Spot" && (
                      <View className="mb-4">
                        <Text className="text-sm font-karla-bold text-gray-700 mb-2">
                          Operating Hours
                        </Text>
                        <View className="flex-row space-x-3">
                          <View className="flex-1">
                            <Text className="text-xs text-gray-600 mb-1">
                              Opens at
                            </Text>
                            <TextInput
                              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-base text-black"
                              value={editOpenTime}
                              onChangeText={setEditOpenTime}
                              placeholder="8:00 AM"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs text-gray-600 mb-1">
                              Closes at
                            </Text>
                            <TextInput
                              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-base text-black"
                              value={editCloseTime}
                              onChangeText={setEditCloseTime}
                              placeholder="10:00 PM"
                            />
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Workshop Schedule */}
                    {editingOpportunity.category === "Workshop / Seminar" && (
                      <>
                        <View className="mb-4">
                          <Text className="text-sm font-karla-bold text-gray-700 mb-2">
                            Workshop Time
                          </Text>
                          <View className="flex-row space-x-3">
                            <View className="flex-1">
                              <Text className="font-karla text-xs text-gray-600 mb-1">
                                Starts at
                              </Text>
                              <TextInput
                                className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-base text-black"
                                value={editWorkshopStarts}
                                onChangeText={setEditWorkshopStarts}
                                placeholder="9:00 AM"
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-karla text-gray-600 mb-1">
                                Ends at
                              </Text>
                              <TextInput
                                className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-base text-black"
                                value={editWorkshopEnds}
                                onChangeText={setEditWorkshopEnds}
                                placeholder="5:00 PM"
                              />
                            </View>
                          </View>
                        </View>

                        {/* Repeat Options */}
                        <View className="mb-4">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-karla-bold text-gray-700">
                              Repeats
                            </Text>
                            <TouchableOpacity
                              className={`w-12 h-6 rounded-full ${
                                editRepeats ? "bg-[#4B1EB4]" : "bg-gray-300"
                              }`}
                              onPress={() => setEditRepeats(!editRepeats)}
                            >
                              <View
                                className="w-5 h-5 rounded-full bg-white"
                                style={{
                                  transform: [
                                    { translateX: editRepeats ? 24 : 2 },
                                  ],
                                  marginTop: 2,
                                }}
                              />
                            </TouchableOpacity>
                          </View>

                          {editRepeats && (
                            <View className="bg-gray-50 border border-gray-300 rounded-xl p-3">
                              <Text className="text-sm text-gray-600 font-karla mb-2">
                                Repeat on days:
                              </Text>
                              <View className="flex-row flex-wrap gap-2">
                                {[
                                  "Monday",
                                  "Tuesday",
                                  "Wednesday",
                                  "Thursday",
                                  "Friday",
                                  "Saturday",
                                  "Sunday",
                                ].map((day) => (
                                  <TouchableOpacity
                                    key={day}
                                    className={`px-3 py-2 rounded-full border ${
                                      editSelectedDays.includes(day)
                                        ? "bg-[#4B1EB4] border-[#4B1EB4]"
                                        : "bg-white border-gray-300"
                                    }`}
                                    onPress={() => toggleEditDay(day)}
                                  >
                                    <Text
                                      className={`text-sm font-karla ${
                                        editSelectedDays.includes(day)
                                          ? "text-white"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {day.substring(0, 3)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      </>
                    )}

                    {/* Status */}
                    <View className="mb-4">
                      <Text className="text-sm font-karla-bold text-gray-700 mb-2">
                        Status
                      </Text>
                      <View className="flex-row space-x-1">
                        <TouchableOpacity
                          className={`flex-1 py-3 rounded-xl border-2 ${
                            editStatus === "active"
                              ? "bg-green-50 border-green-500"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onPress={() => setEditStatus("active")}
                        >
                          <Text
                            className={`text-center font-karla-bold ${
                              editStatus === "active"
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className={`flex-1 py-3 rounded-xl border-2 ${
                            editStatus === "closed"
                              ? "bg-red-50 border-red-500"
                              : "bg-gray-50 border-gray-300"
                          }`}
                          onPress={() => setEditStatus("closed")}
                        >
                          <Text
                            className={`text-center font-karla-bold ${
                              editStatus === "closed"
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            Closed
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Note about category */}
                    <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                      <View className="flex-row items-start">
                        <Ionicons
                          name="information-circle"
                          size={20}
                          color="#3B82F6"
                        />
                        <View className="flex-1 ml-2">
                          <Text className="font-karla text-blue-800 text-sm">
                            Note: Only the category cannot be changed after
                            creation. All other fields can be updated.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row space-x-3 mt-4">
                      <TouchableOpacity
                        className="flex-1 bg-gray-200 rounded-xl py-3"
                        onPress={() => setEditModalVisible(false)}
                        disabled={isSaving}
                      >
                        <Text className="text-center font-karla-bold text-gray-700">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-[#4B1EB4] rounded-xl py-3"
                        onPress={handleSaveEdit}
                        disabled={isSaving}
                      >
                        <Text className="text-center font-karla-bold text-white">
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-karla-bold text-[#4B1EB4]">
                  Opportunity Details
                </Text>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#4B1EB4" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedOpportunity && (
                  <View>
                    <View className="mb-4">
                      <Text className="font-karla-bold text-lg text-[#4B1EB4] mb-2">
                        {selectedOpportunity.title}
                      </Text>
                      <View className="flex-row items-center mb-2">
                        {getCategoryIcon(selectedOpportunity.category)}
                        <Text className="font-karla text-gray-600 ml-2">
                          {selectedOpportunity.category}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="font-karla-bold text-gray-700 mb-1">
                        Description:
                      </Text>
                      <Text className="font-karla text-gray-600">
                        {selectedOpportunity.description}
                      </Text>
                    </View>

                    {selectedOpportunity.amount && (
                      <View className="mb-4">
                        <Text className="font-karla-bold text-gray-700 mb-1">
                          Amount:
                        </Text>
                        <Text className="font-karla text-gray-600">
                          {selectedOpportunity.amount}
                        </Text>
                      </View>
                    )}

                    {selectedOpportunity.eligibility && (
                      <View className="mb-4">
                        <Text className="font-karla-bold text-gray-700 mb-1">
                          Eligibility:
                        </Text>
                        <Text className="font-karla text-gray-600">
                          {selectedOpportunity.eligibility}
                        </Text>
                      </View>
                    )}

                    {selectedOpportunity.dateMilestones &&
                      selectedOpportunity.dateMilestones.length > 0 && (
                        <View className="mb-4">
                          <Text className="font-karla-bold text-gray-700 mb-2">
                            Milestones:
                          </Text>
                          {selectedOpportunity.dateMilestones.map(
                            (milestone: any, index: number) => (
                              <View
                                key={index}
                                className="bg-purple-50 p-2 rounded-lg mb-2"
                              >
                                <Text className="font-karla-bold text-[#4B1EB4]">
                                  {milestone.name}
                                </Text>
                                <Text className="font-karla text-gray-600">
                                  {milestone.date}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}

                    {selectedOpportunity.location && (
                      <View className="mb-4">
                        <Text className="font-karla-bold text-gray-700 mb-1">
                          Location:
                        </Text>
                        <Text className="font-karla text-gray-600">
                          Lat:{" "}
                          {selectedOpportunity.location.latitude?.toFixed(6)}
                        </Text>
                        <Text className="font-karla text-gray-600">
                          Long:{" "}
                          {selectedOpportunity.location.longitude?.toFixed(6)}
                        </Text>
                      </View>
                    )}

                    {selectedOpportunity.openTime && (
                      <View className="mb-4">
                        <Text className="font-karla-bold text-gray-700 mb-1">
                          Hours:
                        </Text>
                        <Text className="font-karla text-gray-600">
                          {selectedOpportunity.openTime} -{" "}
                          {selectedOpportunity.closeTime}
                        </Text>
                      </View>
                    )}

                    {selectedOpportunity.workshopStarts && (
                      <View className="mb-4">
                        <Text className="font-karla-bold text-gray-700 mb-1">
                          Workshop Schedule:
                        </Text>
                        <Text className="font-karla text-gray-600">
                          {selectedOpportunity.workshopStarts} -{" "}
                          {selectedOpportunity.workshopEnds}
                        </Text>
                        {selectedOpportunity.repeats && (
                          <Text className="font-karla text-gray-600 mt-1">
                            Repeats on:{" "}
                            {selectedOpportunity.selectedDays?.join(", ")}
                          </Text>
                        )}
                      </View>
                    )}

                    <View className="mb-4">
                      <Text className="font-karla-bold text-gray-700 mb-1">
                        Status:
                      </Text>
                      <Text
                        className={`font-karla ${
                          selectedOpportunity.status === "active"
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {selectedOpportunity.status?.toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>

                    <View className="mb-4">
                      <Text className="font-karla-bold text-gray-700 mb-1">
                        Created:
                      </Text>
                      <Text className="font-karla text-gray-600">
                        {formatDate(selectedOpportunity.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add milestone modal */}
        <Modal
          visible={showAddMilestoneModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddMilestoneModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-2xl p-6 w-[85%]">
              <Text className="text-lg font-karla-bold text-[#4B1EB4] mb-4">
                Add Milestone
              </Text>
              <TextInput
                className="bg-gray-100 rounded-lg px-4 py-3 mb-3 font-karla text-base text-black"
                placeholder="Milestone Name"
                placeholderTextColor="#B0B0B0"
                value={newMilestoneName}
                onChangeText={setNewMilestoneName}
              />
              <TouchableOpacity
                className="bg-gray-100 rounded-lg px-4 py-3 mb-3"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="font-karla text-base text-black">
                  {milestoneDateObj
                    ? milestoneDateObj.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select Milestone Date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={milestoneDateObj || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setMilestoneDateObj(selectedDate);
                      setNewMilestoneDate(
                        selectedDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      );
                    }
                  }}
                />
              )}
              <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                  className="bg-gray-200 rounded-lg py-2 px-4 flex-1 mr-2"
                  onPress={() => setShowAddMilestoneModal(false)}
                >
                  <Text className="text-center font-karla-bold text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-[#4B1EB4] rounded-lg py-2 px-4 flex-1 ml-2"
                  onPress={() => {
                    if (newMilestoneName.trim() && milestoneDateObj) {
                      setEditDateMilestones([
                        ...editDateMilestones,
                        {
                          name: newMilestoneName.trim(),
                          date: milestoneDateObj.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }),
                        },
                      ]);
                      setShowAddMilestoneModal(false);
                      setMilestoneDateObj(null);
                      setNewMilestoneDate("");
                    }
                  }}
                >
                  <Text className="text-center font-karla-bold text-white">
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}
