import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "../../../components/PlatformMap";
import { getOrganizationsWithLocations, getAllOpportunitiesWithLocations } from "../../../services/firestoreService";

interface Organization {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  email?: string;
  photoURL?: string;
  address?: string;
  description?: string;
  category?: string;
}

interface Opportunity {
  id: string;
  title: string;
  category: string;
  collectionType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  // Study Spot specific
  availability?: string;
  availabilityHours?: string;
  // Event/Workshop specific
  startDate?: string;
  endDate?: string;
  // Scholarship specific
  amount?: string;
  deadline?: string;
  // Organization info
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
}

type MapItem = Organization | Opportunity;

const Map = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState<"all" | "organizations" | "studySpots" | "workshops" | "events" | "scholarships" | "resources">("all");

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const [orgs, opps] = await Promise.all([
        getOrganizationsWithLocations(),
        getAllOpportunitiesWithLocations()
      ]);
      setOrganizations(orgs);
      setOpportunities(opps);
      console.log("📍 Map loaded:", orgs.length, "organizations,", opps.length, "opportunities");
    } catch (error) {
      console.error("Error loading map data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Filter by search query
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply category filter
  const displayedOrganizations = showFilter === "all" || showFilter === "organizations" ? filteredOrganizations : [];
  const displayedOpportunities = filteredOpportunities.filter(opp => {
    if (showFilter === "all") return true;
    if (showFilter === "studySpots") return opp.category === "Study Spot";
    if (showFilter === "workshops") return opp.category === "Workshop / Seminar";
    if (showFilter === "events") return opp.category === "Competition / Event";
    if (showFilter === "scholarships") return opp.category === "Scholarship / Grant";
    if (showFilter === "resources") return opp.category === "Resources";
    return false;
  });

  const openDirections = useCallback((latitude: number, longitude: number, label: string) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
      default: 'https://maps.google.com/'
    });
    
    const latLng = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}${latLng}?q=${label}`,
      default: `${scheme}?q=${label}@${latLng}`
    });

    Linking.canOpenURL(url!).then((supported) => {
      if (supported) {
        Linking.openURL(url!);
      } else {
        Alert.alert("Error", "Unable to open maps application");
      }
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#4B1EB4]" edges={["top"]}>
      {/* Top Row: Search Bar with icons */}
      <View className="flex-row items-center px-3 pt-4 pb-2">
        {/* Back Arrow */}
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-full shadow h-12 flex-1 mx-2">
          <Ionicons
            name="search-outline"
            size={22}
            color="#18181B"
            className="ml-4"
          />
          <TextInput
            className="ml-2 flex-1 font-karla text-[15px] text-[#605E8F]"
            placeholder="Search locations..."
            placeholderTextColor="#605E8F"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close" size={22} color="#A1A1AA" className="mr-2" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={loadMapData}>
          <Ionicons
            name="refresh-outline"
            size={22}
            color="#ffffffff"
            className="mr-4"
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="px-3 pb-2">
        <View className="flex-row gap-2 flex-wrap">
          <TouchableOpacity
            onPress={() => setShowFilter("all")}
            className={`px-3 py-2 rounded-full ${showFilter === "all" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "all" ? "text-[#4B1EB4]" : "text-white"}`}>
              All ({organizations.length + opportunities.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("organizations")}
            className={`px-3 py-2 rounded-full ${showFilter === "organizations" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "organizations" ? "text-[#4B1EB4]" : "text-white"}`}>
              Orgs ({organizations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("studySpots")}
            className={`px-3 py-2 rounded-full ${showFilter === "studySpots" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "studySpots" ? "text-[#4B1EB4]" : "text-white"}`}>
              Study ({opportunities.filter(o => o.category === "Study Spot").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("workshops")}
            className={`px-3 py-2 rounded-full ${showFilter === "workshops" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "workshops" ? "text-[#4B1EB4]" : "text-white"}`}>
              Workshops ({opportunities.filter(o => o.category === "Workshop / Seminar").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("events")}
            className={`px-3 py-2 rounded-full ${showFilter === "events" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "events" ? "text-[#4B1EB4]" : "text-white"}`}>
              Events ({opportunities.filter(o => o.category === "Competition / Event").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("scholarships")}
            className={`px-3 py-2 rounded-full ${showFilter === "scholarships" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "scholarships" ? "text-[#4B1EB4]" : "text-white"}`}>
              Scholarships ({opportunities.filter(o => o.category === "Scholarship / Grant").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("resources")}
            className={`px-3 py-2 rounded-full ${showFilter === "resources" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "resources" ? "text-[#4B1EB4]" : "text-white"}`}>
              Resources ({opportunities.filter(o => o.category === "Resources").length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1 mt-2 overflow-hidden">
        {loading ? (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <ActivityIndicator size="large" color="#4B1EB4" />
            <Text className="mt-2 text-gray-600 font-karla">Loading map data...</Text>
          </View>
        ) : (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 9.3077,
              longitude: 123.3054,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {/* Organization Markers - Purple */}
            {displayedOrganizations.map((org) => (
              <Marker
                key={`org-${org.id}`}
                coordinate={{
                  latitude: org.location.latitude,
                  longitude: org.location.longitude,
                }}
                title={org.name}
                description={org.address || "Organization"}
                pinColor="#4B1EB4"
                onPress={() => setSelectedItem(org)}
              />
            ))}
            
            {/* Opportunity Markers - Different colors per category */}
            {displayedOpportunities.map((opp) => {
              // Determine pin color based on category
              const getPinColor = () => {
                switch (opp.category) {
                  case "Study Spot":
                    return "#10B981"; // Green
                  case "Workshop / Seminar":
                    return "#3B82F6"; // Blue
                  case "Competition / Event":
                    return "#F97316"; // Orange
                  case "Scholarship / Grant":
                    return "#FCD34D"; // Gold
                  case "Resources":
                    return "#14B8A6"; // Teal
                  default:
                    return "#6B7280"; // Gray fallback
                }
              };

              return (
                <Marker
                  key={`opp-${opp.id}-${opp.category}`}
                  coordinate={{
                    latitude: opp.location.latitude,
                    longitude: opp.location.longitude,
                  }}
                  title={opp.title}
                  description={opp.address || opp.category}
                  pinColor={getPinColor()}
                  onPress={() => setSelectedItem(opp)}
                />
              );
            })}
          </MapView>
        )}
      </View>

      {/* Info Card - Shows when item is selected */}
      {selectedItem && (
        <View className="absolute bottom-0 rounded-t-2xl left-0 right-0">
          <View className="bg-white shadow-lg p-4">
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setSelectedItem(null)}
              className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="close" size={20} color="#18181B" />
            </TouchableOpacity>

            {/* Display for Organizations */}
            {"name" in selectedItem && !("category" in selectedItem) ? (
              <>
                {/* Organization Photo */}
                {selectedItem.photoURL ? (
                  <Image
                    source={{ uri: selectedItem.photoURL }}
                    className="w-full h-32 rounded-xl mb-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-32 rounded-xl mb-3 bg-[#E5E0FF] items-center justify-center">
                    <Ionicons name="business" size={48} color="#4B1EB4" />
                  </View>
                )}

                {/* Organization Name */}
                <Text className="font-karla-bold text-[18px] text-[#18181B] mb-2">
                  {selectedItem.name}
                </Text>

                {/* Verification Badge */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-[#DBEAFE] rounded-full px-3 py-1 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#1D4ED8" />
                    <Text className="text-[#1D4ED8] text-[12px] font-karla-bold ml-1">
                      Verified Organization
                    </Text>
                  </View>
                </View>

                {/* Address */}
                {selectedItem.address && (
                  <View className="flex-row items-start mb-3">
                    <MaterialIcons name="location-on" size={18} color="#4B1EB4" />
                    <Text className="ml-2 flex-1 text-[#18181B] text-[13px] font-karla">
                      {selectedItem.address}
                    </Text>
                  </View>
                )}

                {/* Description */}
                {selectedItem.description && (
                  <Text className="text-[#6B7280] text-[13px] font-karla mb-3">
                    {selectedItem.description}
                  </Text>
                )}

                {/* Contact */}
                {selectedItem.email && (
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="mail" size={16} color="#4B1EB4" />
                    <Text className="ml-2 text-[#18181B] text-[13px] font-karla">
                      {selectedItem.email}
                    </Text>
                  </View>
                )}
              </>
            ) : "category" in selectedItem ? (
              /* Display for All Opportunities (Study Spots, Workshops, Events, Scholarships, Resources) */
              (() => {
                const opp = selectedItem as Opportunity;
                
                // Dynamic styling based on category
                const getCategoryStyle = () => {
                  switch (opp.category) {
                    case "Study Spot":
                      return { bg: "#D1FAE5", color: "#10B981", icon: "book" as const, iconOutline: "book-outline" as const };
                    case "Workshop / Seminar":
                      return { bg: "#DBEAFE", color: "#3B82F6", icon: "school" as const, iconOutline: "school-outline" as const };
                    case "Competition / Event":
                      return { bg: "#FED7AA", color: "#F97316", icon: "calendar" as const, iconOutline: "calendar-outline" as const };
                    case "Scholarship / Grant":
                      return { bg: "#FEF3C7", color: "#F59E0B", icon: "trophy" as const, iconOutline: "trophy-outline" as const };
                    case "Resources":
                      return { bg: "#CCFBF1", color: "#14B8A6", icon: "library" as const, iconOutline: "library-outline" as const };
                    default:
                      return { bg: "#F3F4F6", color: "#6B7280", icon: "information-circle" as const, iconOutline: "information-circle-outline" as const };
                  }
                };
                const style = getCategoryStyle();

                return (
                  <>
                    {/* Icon */}
                    <View className="w-full h-32 rounded-xl mb-3 items-center justify-center" style={{ backgroundColor: style.bg }}>
                      <Ionicons name={style.icon} size={48} color={style.color} />
                    </View>

                    {/* Title */}
                    <Text className="font-karla-bold text-[18px] text-[#18181B] mb-2">
                      {opp.title}
                    </Text>

                    {/* Category Badge */}
                    <View className="flex-row items-center mb-3">
                      <View className="rounded-full px-3 py-1 flex-row items-center" style={{ backgroundColor: style.bg }}>
                        <Ionicons name={style.iconOutline} size={16} color={style.color} />
                        <Text className="text-[12px] font-karla-bold ml-1" style={{ color: style.color }}>
                          {opp.category}
                        </Text>
                      </View>
                      {opp.organizationVerified && (
                        <View className="bg-[#DBEAFE] rounded-full px-3 py-1 flex-row items-center ml-2">
                          <Ionicons name="checkmark-circle" size={14} color="#1D4ED8" />
                          <Text className="text-[#1D4ED8] text-[11px] font-karla-bold ml-1">
                            Verified
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Address */}
                    {opp.address && (
                      <View className="flex-row items-start mb-3">
                        <MaterialIcons name="location-on" size={18} color={style.color} />
                        <Text className="ml-2 flex-1 text-[#18181B] text-[13px] font-karla">
                          {opp.address}
                        </Text>
                      </View>
                    )}

                    {/* Availability - For Study Spots */}
                    {opp.availability && (
                      <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: style.bg }}>
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="time" size={18} color={style.color} />
                          <Text className="ml-2 font-karla-bold text-[14px]" style={{ color: style.color }}>
                            Availability
                          </Text>
                        </View>
                        <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                          {opp.availability}
                        </Text>
                        {opp.availabilityHours && (
                          <Text className="ml-7 text-[#18181B] text-[13px] font-karla-bold mt-1">
                            Hours: {opp.availabilityHours}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Date Range - For Workshops/Events */}
                    {(opp.startDate || opp.endDate) && (
                      <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: style.bg }}>
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="calendar" size={18} color={style.color} />
                          <Text className="ml-2 font-karla-bold text-[14px]" style={{ color: style.color }}>
                            Event Schedule
                          </Text>
                        </View>
                        {opp.startDate && (
                          <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                            Start: {opp.startDate}
                          </Text>
                        )}
                        {opp.endDate && (
                          <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                            End: {opp.endDate}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Amount & Deadline - For Scholarships */}
                    {(opp.amount || opp.deadline) && (
                      <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: style.bg }}>
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="cash" size={18} color={style.color} />
                          <Text className="ml-2 font-karla-bold text-[14px]" style={{ color: style.color }}>
                            Scholarship Details
                          </Text>
                        </View>
                        {opp.amount && (
                          <Text className="ml-7 text-[#18181B] text-[13px] font-karla-bold">
                            Amount: {opp.amount}
                          </Text>
                        )}
                        {opp.deadline && (
                          <Text className="ml-7 text-[#18181B] text-[13px] font-karla mt-1">
                            Deadline: {opp.deadline}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Organization Info */}
                    <View className="flex-row items-center mb-3">
                      <Ionicons name="business-outline" size={16} color="#6B7280" />
                      <Text className="ml-2 text-[#6B7280] text-[13px] font-karla">
                        By {opp.organizationName}
                      </Text>
                    </View>

                    {/* Description */}
                    {opp.description && (
                      <Text className="text-[#6B7280] text-[13px] font-karla mb-3">
                        {opp.description}
                      </Text>
                    )}
                  </>
                );
              })()
            ) : null}

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity 
                className="flex-1 bg-[#4B1EB4] rounded-full py-3 flex-row items-center justify-center"
                onPress={() => {
                  const lat = selectedItem.location.latitude;
                  const lng = selectedItem.location.longitude;
                  const label = "name" in selectedItem ? selectedItem.name : selectedItem.title;
                  openDirections(lat, lng, label);
                }}
              >
                <Ionicons name="navigate" size={20} color="#fff" className="mr-2" />
                <Text className="text-white font-karla-bold text-[15px]">
                  Directions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-[#E5E0FF] rounded-full py-3 flex-row items-center justify-center"
                onPress={() => {
                  Alert.alert(
                    "name" in selectedItem ? selectedItem.name : selectedItem.title,
                    selectedItem.description || "No additional details available",
                    [{ text: "OK" }]
                  );
                }}
              >
                <Ionicons name="information-circle" size={20} color="#4B1EB4" className="mr-2" />
                <Text className="text-[#4B1EB4] font-karla-bold text-[15px]">
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Stats Info - Show when no item is selected */}
      {!selectedItem && !loading && (
        <View className="absolute bottom-4 left-4 right-4">
          <View className="bg-white rounded-xl shadow-lg p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="bg-[#4B1EB4] rounded-full p-2">
                  <Ionicons name="map" size={20} color="#fff" />
                </View>
                <View className="ml-3">
                  <Text className="font-karla-bold text-[15px] text-[#18181B]">
                    {organizations.length + opportunities.length} Locations
                  </Text>
                  <Text className="font-karla text-[12px] text-[#6B7280]">
                    Tap a pin to view details
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Legend */}
            <View className="mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row flex-wrap gap-2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#4B1EB4] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Orgs ({organizations.length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#10B981] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Study ({opportunities.filter(o => o.category === "Study Spot").length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#3B82F6] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Workshops ({opportunities.filter(o => o.category === "Workshop / Seminar").length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#F97316] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Events ({opportunities.filter(o => o.category === "Competition / Event").length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#F59E0B] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Scholarships ({opportunities.filter(o => o.category === "Scholarship / Grant").length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#14B8A6] mr-1.5" />
                  <Text className="font-karla text-[10px] text-[#6B7280]">
                    Resources ({opportunities.filter(o => o.category === "Resources").length})
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Map;
