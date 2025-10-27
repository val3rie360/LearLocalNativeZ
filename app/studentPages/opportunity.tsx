import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "../../contexts/AuthContext";
import { getDownloadUrl } from "../../services/cloudinaryUploadService";
import {
  getOpportunityDetails,
  isRegisteredToOpportunity,
  registerToOpportunity,
  unregisterFromOpportunity,
} from "../../services/firestoreService";

const Opportunity = () => {
  const { id, specificCollection } = useLocalSearchParams<{
    id: string;
    specificCollection: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || !specificCollection) {
        setError("Missing opportunity information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getOpportunityDetails(id, specificCollection);
        setOpportunity(data);

        // Check if user is registered to this opportunity
        if (user?.uid) {
          const registered = await isRegisteredToOpportunity(user.uid, id);
          setIsRegistered(registered);
        }
      } catch (err: any) {
        console.error("Error fetching opportunity:", err);
        setError(err.message || "Failed to load opportunity");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, specificCollection, user?.uid]);

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format amount with Philippine Peso currency
  const formatAmount = (amount: string) => {
    if (!amount || amount === "N/A") return "N/A";

    // Remove any existing currency symbols and clean the amount
    let cleanAmount = amount.replace(/[^\d.,]/g, "");

    // Handle different decimal separators (comma vs period)
    if (cleanAmount.includes(",") && cleanAmount.includes(".")) {
      // If both exist, assume comma is thousands separator and period is decimal
      cleanAmount = cleanAmount.replace(/,/g, "");
    } else if (cleanAmount.includes(",") && !cleanAmount.includes(".")) {
      // If only comma exists, check if it's decimal or thousands separator
      const parts = cleanAmount.split(",");
      if (parts.length === 2 && parts[1].length <= 2) {
        // Likely decimal separator
        cleanAmount = cleanAmount.replace(",", ".");
      } else {
        // Likely thousands separator
        cleanAmount = cleanAmount.replace(/,/g, "");
      }
    }

    // Convert to number and format with commas
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return "N/A";

    // Format with commas and handle decimals
    const formatted = numAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `Php ${formatted}`;
  };

  const handleRegister = async () => {
    const rawLink = opportunity?.link?.trim();
    if (!rawLink) {
      Alert.alert("Unavailable", "No registration link provided.");
      return;
    }

    // Automatically enable deadline tracking when registering (if not already tracking)
    if (user?.uid && id && specificCollection && !isRegistered) {
      try {
        await registerToOpportunity(user.uid, id, specificCollection);
        setIsRegistered(true);
        console.log(
          "✅ Deadline tracking automatically enabled on registration"
        );
      } catch (error) {
        console.error("Error auto-enabling tracking:", error);
        // Continue with registration even if tracking fails
      }
    }

    const normalizedLink = /^https?:\/\//i.test(rawLink)
      ? rawLink
      : `https://${rawLink}`;
    const canOpen = await Linking.canOpenURL(normalizedLink);
    if (!canOpen) {
      Alert.alert("Error", "Cannot open this link.");
      return;
    }
    await Linking.openURL(normalizedLink);
  };

  const handleMemorandumView = async () => {
    if (!opportunity?.memorandumCloudinaryId) {
      Alert.alert("Error", "Memorandum not available.");
      return;
    }

    try {
      const viewUrl = await getDownloadUrl(opportunity.memorandumCloudinaryId);
      const canOpen = await Linking.canOpenURL(viewUrl);

      if (!canOpen) {
        Alert.alert("Error", "Cannot open the memorandum.");
        return;
      }

      await Linking.openURL(viewUrl);
    } catch (error) {
      console.error("Error viewing memorandum:", error);
      Alert.alert("Error", "Failed to open memorandum.");
    }
  };

  const handleToggleTracking = async () => {
    if (!user?.uid) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to track deadlines for this opportunity."
      );
      return;
    }

    if (!id || !specificCollection) {
      Alert.alert("Error", "Missing opportunity information.");
      return;
    }

    try {
      setIsTrackingLoading(true);

      if (isRegistered) {
        // Unregister from tracking
        await unregisterFromOpportunity(user.uid, id);
        setIsRegistered(false);
        Alert.alert(
          "Tracking Removed",
          "This opportunity has been removed from your calendar."
        );
      } else {
        // Register for tracking
        await registerToOpportunity(user.uid, id, specificCollection);
        setIsRegistered(true);

        // Navigate to Calendar tab after successful tracking
        Alert.alert("Tracking Enabled", "Deadlines added to your calendar!", [
          {
            text: "View Calendar",
            onPress: () => router.push("/studentPages/(tabs)/Calendar"),
          },
          { text: "Stay Here", style: "cancel" },
        ]);
      }
    } catch (error) {
      console.error("Error toggling tracking:", error);
      Alert.alert("Error", "Failed to update tracking status.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE] items-center justify-center">
        <ActivityIndicator size="large" color="#4B1EB4" />
        <Text className="text-[#666] mt-4 font-karla">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !opportunity) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE] items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-[#666] text-center font-karla mt-4">
          {error || "Opportunity not found"}
        </Text>
      </SafeAreaView>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4B1EB4" />
          <Text className="text-[#666] mt-4 font-karla">
            Loading opportunity...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-[#EF4444] font-karla-bold text-[20px] mt-4 text-center">
            Error Loading Opportunity
          </Text>
          <Text className="text-[#666] font-karla text-center mt-2 mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#4B1EB4] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-karla-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle opportunity not found
  if (!opportunity) {
    return (
      <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="document-outline" size={64} color="#9CA3AF" />
          <Text className="text-[#374151] font-karla-bold text-[20px] mt-4 text-center">
            Opportunity Not Found
          </Text>
          <Text className="text-[#6B7280] font-karla text-center mt-2 mb-6">
            This opportunity may have been removed or is no longer available.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#4B1EB4] px-6 py-3 rounded-full"
          >
            <Text className="text-white font-karla-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="bg-[#4B1EB4] rounded-b-2xl pb-7 pt-12 px-5">
        {/* Back Arrow */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text className="text-white font-karla-bold text-[28px] leading-tight mb-3">
          {opportunity.title}
        </Text>
        <View className="flex-row items-center mb-4">
          <View className="bg-[#FDE68A] rounded-full px-3 py-1 mr-2">
            <Text className="text-[#92400E] text-[13px] font-karla-bold">
              {opportunity.category || "Opportunity"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleTracking}
            disabled={isTrackingLoading}
          >
            {isTrackingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isRegistered ? "calendar" : "calendar-outline"}
                size={22}
                color={isRegistered ? "#FDE68A" : "#fff"}
              />
            )}
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text className="ml-2 text-white text-[15px] font-karla">
            <Text className="font-karla-bold">Posted by:</Text>{" "}
            {opportunity?.organizationProfile?.name ??
              opportunity?.organizationName ??
              opportunity?.organization?.name ??
              "Organization"}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text className="ml-2 text-white text-[15px] font-karla">
            <Text className="font-karla-bold">Posted on:</Text>{" "}
            {formatDate(opportunity.createdAt)}
          </Text>
        </View>
        {(opportunity.location?.address || opportunity.studySpotLocation) && (
          <View className="flex-row items-center">
            <MaterialIcons name="location-on" size={16} color="#fff" />
            <Text className="ml-2 text-white text-[15px] font-karla">
              <Text className="font-karla-bold">Location:</Text>{" "}
              {opportunity.location?.address || opportunity.studySpotLocation}
            </Text>
          </View>
        )}
      </View>

      {/* Everything below header */}
      <View className="flex-1 bg-[#F6F4FE]">
        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Row */}
          {opportunity.amount && (
            <View className="flex-row justify-between mb-5">
              <View
                className="bg-white rounded-xl px-3 py-3 items-center flex-1 mx-1 shadow-sm"
                style={{ elevation: 2 }}
              >
                <Text className="font-karla-bold text-[#18181B] text-[13px] mb-1">
                  {formatAmount(opportunity.amount)}
                </Text>
                <Text className="text-[#6B7280] text-[11px] font-karla">
                  Amount
                </Text>
              </View>
            </View>
          )}

          {/* Description & Requirements */}
          <View
            className="bg-white rounded-xl p-4 mb-6 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2">
              Description
            </Text>
            <Text className="text-[#605E8F] text-[14px] font-karla mb-3">
              {opportunity.description || "No description available"}
            </Text>

            {/* Workshop/Event Details Section */}
            {(opportunity.category === "Workshop / Seminar" ||
              opportunity.category === "Competition / Event") && (
              <>
                <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2 mt-4">
                  Event Details
                </Text>
                <View className="bg-[#EFF6FF] rounded-xl p-3 mb-3">
                  {/* Workshop Date */}
                  {opportunity.workshopDate && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="calendar" size={18} color="#3B82F6" />
                      <View className="ml-2 flex-1">
                        <Text className="font-karla-bold text-[14px] text-[#3B82F6] mb-1">
                          Date
                        </Text>
                        <Text className="text-[#18181B] text-[13px] font-karla">
                          {opportunity.workshopDate}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Event Type (Online/In-Person) */}
                  {(opportunity.isInPersonWorkshop !== undefined ||
                    opportunity.isInPersonEvent !== undefined) && (
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="globe" size={18} color="#3B82F6" />
                      <View className="ml-2 flex-1">
                        <Text className="font-karla-bold text-[14px] text-[#3B82F6] mb-1">
                          Event Type
                        </Text>
                        <Text className="text-[#18181B] text-[13px] font-karla">
                          {opportunity.isInPersonWorkshop ||
                          opportunity.isInPersonEvent
                            ? "🏢 In-Person"
                            : "🌐 Online"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Workshop Times */}
                  {(opportunity.workshopStarts || opportunity.workshopEnds) && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="time" size={18} color="#3B82F6" />
                      <View className="ml-2 flex-1">
                        <Text className="font-karla-bold text-[14px] text-[#3B82F6] mb-1">
                          Schedule
                        </Text>
                        {opportunity.workshopStarts && opportunity.workshopEnds ? (
                          <Text className="text-[#18181B] text-[13px] font-karla">
                            {opportunity.workshopStarts} - {opportunity.workshopEnds}
                          </Text>
                        ) : (
                          <Text className="text-[#18181B] text-[13px] font-karla">
                            {opportunity.workshopStarts || opportunity.workshopEnds}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Repeat Days */}
                  {opportunity.repeats && opportunity.selectedDays?.length > 0 && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="repeat" size={18} color="#3B82F6" />
                      <View className="ml-2 flex-1">
                        <Text className="font-karla-bold text-[14px] text-[#3B82F6] mb-1">
                          Repeats
                        </Text>
                        <Text className="text-[#18181B] text-[13px] font-karla">
                          {opportunity.selectedDays.join(", ")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Availability Section - For Study Spots */}
            {opportunity.category === "Study Spot" && (
              <>
                <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2 mt-4">
                  Availability
                </Text>
                <View className="bg-[#D1FAE5] rounded-xl p-3 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time" size={18} color="#10B981" />
                    <Text className="ml-2 font-karla-bold text-[14px] text-[#10B981]">
                      Operating Hours
                    </Text>
                  </View>
                  {opportunity.openTime && opportunity.closeTime ? (
                    <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                      {opportunity.openTime} - {opportunity.closeTime}
                    </Text>
                  ) : (
                    <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                      Hours not specified
                    </Text>
                  )}
                  {opportunity.availabilityType && (
                    <Text className="ml-7 text-[#18181B] text-[13px] font-karla-bold mt-1">
                      Available: {opportunity.availabilityType}
                    </Text>
                  )}
                </View>
              </>
            )}

            {opportunity.eligibility && (
              <>
                <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2">
                  Eligibility
                </Text>
                <Text className="text-[#605E8F] text-[14px] font-karla mb-3">
                  {opportunity.eligibility}
                </Text>
              </>
            )}

            {opportunity.dateMilestones &&
              opportunity.dateMilestones.length > 0 && (
                <>
                  <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2">
                    Important Dates
                  </Text>
                  {opportunity.dateMilestones.map(
                    (milestone: any, idx: number) => (
                      <Text
                        key={idx}
                        className="text-[#605E8F] text-[14px] font-karla mb-1"
                      >
                        • {milestone.name}: {milestone.date}
                      </Text>
                    )
                  )}
                </>
              )}
          </View>

          {/* Official Memorandum Section */}
          {opportunity.memorandumCloudinaryId && (
            <View
              className="bg-white rounded-xl p-4 mb-6 shadow-sm"
              style={{ elevation: 2 }}
            >
              <Text className="font-karla-bold text-[16px] text-[#18181B] mb-3">
                Official Memorandum
              </Text>
              <TouchableOpacity
                className="bg-[#F0EDFF] rounded-xl p-4 flex-row items-center justify-between"
                onPress={handleMemorandumView}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <View className="bg-[#4B1EB4] rounded-lg p-2 mr-3">
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-karla-bold text-[14px] text-[#18181B] mb-1">
                      {opportunity.memorandumFile?.name ||
                        "Official Memorandum"}
                    </Text>
                    <Text className="text-[#6B7280] text-[12px] font-karla">
                      Tap to view
                    </Text>
                  </View>
                </View>
                <Ionicons name="eye-outline" size={20} color="#4B1EB4" />
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View className="items-center mb-4 gap-3">
            {/* Map Preview - For Study Spots */}
            {opportunity.category === "Study Spot" && opportunity.location && (
              <TouchableOpacity
                className="w-full max-w-[300px] mb-3"
                onPress={() => {
                  // Navigate to Map.tsx with the study spot centered
                  router.push({
                    pathname: "/studentPages/(tabs)/Map",
                    params: {
                      centerLat: opportunity.location.latitude.toString(),
                      centerLng: opportunity.location.longitude.toString(),
                      opportunityId: opportunity.id,
                    },
                  });
                }}
                activeOpacity={0.8}
              >
                <Text className="font-karla-bold text-[16px] text-[#18181B] mb-2 text-center">
                  Location Preview
                </Text>
                <View className="rounded-xl overflow-hidden border-2 border-[#4B1EB4]">
                  <View className="h-32">
                    <MapView
                      style={{ flex: 1 }}
                      region={{
                        latitude: opportunity.location.latitude,
                        longitude: opportunity.location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      moveOnMarkerPress={false}
                    >
                      <Marker
                        coordinate={{
                          latitude: opportunity.location.latitude,
                          longitude: opportunity.location.longitude,
                        }}
                        pinColor="#10B981"
                        title={opportunity.title}
                        description="Study Spot Location"
                      />
                    </MapView>
                  </View>
                  <View className="bg-[#D1FAE5] px-3 py-2 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="location" size={16} color="#10B981" />
                      <Text className="ml-2 text-[#10B981] text-[12px] font-karla-bold">
                        Tap to view on Map
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#10B981"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Track Deadlines Button - Only for non-Study Spot opportunities */}
            {opportunity.category !== "Study Spot" && (
              <TouchableOpacity
                className={`rounded-full py-3 px-8 items-center w-full max-w-[300px] flex-row justify-center ${
                  isRegistered
                    ? "bg-[#F0EDFF] border-2 border-[#4B1EB4]"
                    : "bg-[#4B1EB4]"
                }`}
                activeOpacity={0.8}
                disabled={isTrackingLoading}
                onPress={handleToggleTracking}
              >
                {isTrackingLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isRegistered ? "#4B1EB4" : "#fff"}
                  />
                ) : (
                  <>
                    <Ionicons
                      name={isRegistered ? "checkmark-circle" : "calendar"}
                      size={20}
                      color={isRegistered ? "#4B1EB4" : "#fff"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      className={`font-karla-bold text-[16px] ${
                        isRegistered ? "text-[#4B1EB4]" : "text-white"
                      }`}
                    >
                      {isRegistered ? "Tracking Deadlines" : "Track Deadlines"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Register Now Button - Only for non-Study Spot opportunities */}
            {opportunity.category !== "Study Spot" && (
              <TouchableOpacity
                className={`bg-white border-2 border-[#4B1EB4] rounded-full py-3 px-8 items-center w-full max-w-[300px] ${
                  !opportunity.link ? "opacity-50" : ""
                }`}
                activeOpacity={0.8}
                disabled={!opportunity.link}
                onPress={handleRegister}
              >
                <Text className="text-[#4B1EB4] font-karla-bold text-[16px]">
                  Register Now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Opportunity;
