import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "../../../components/PlatformMap";
import { getOrganizationsWithLocations, getStudySpotsWithLocations, getWorkshopsEventsWithLocations } from "../../../services/firestoreService";

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

interface StudySpot {
  id: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  availability?: string;
  availabilityHours?: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  category: string;
}

interface WorkshopEvent {
  id: string;
  title: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  category: string;
}

type MapItem = Organization | StudySpot | WorkshopEvent;

const Map = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [studySpots, setStudySpots] = useState<StudySpot[]>([]);
  const [workshopsEvents, setWorkshopsEvents] = useState<WorkshopEvent[]>([]);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState<"all" | "organizations" | "studySpots" | "events">("all");

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const [orgs, spots, events] = await Promise.all([
        getOrganizationsWithLocations(),
        getStudySpotsWithLocations(),
        getWorkshopsEventsWithLocations()
      ]);
      setOrganizations(orgs);
      setStudySpots(spots);
      setWorkshopsEvents(events);
    } catch (error) {
      console.error("Error loading map data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudySpots = studySpots.filter(spot =>
    spot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    spot.organizationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkshopsEvents = workshopsEvents.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.organizationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedOrganizations = showFilter === "studySpots" || showFilter === "events" ? [] : filteredOrganizations;
  const displayedStudySpots = showFilter === "organizations" || showFilter === "events" ? [] : filteredStudySpots;
  const displayedWorkshopsEvents = showFilter === "organizations" || showFilter === "studySpots" ? [] : filteredWorkshopsEvents;

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
      <View className="flex-row px-3 pb-2">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setShowFilter("all")}
            className={`px-3 py-2 rounded-full ${showFilter === "all" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "all" ? "text-[#4B1EB4]" : "text-white"}`}>
              All ({organizations.length + studySpots.length + workshopsEvents.length})
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
              Study ({studySpots.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFilter("events")}
            className={`px-3 py-2 rounded-full ${showFilter === "events" ? "bg-white" : "bg-[#5B2DD1]"}`}
          >
            <Text className={`font-karla-bold text-[12px] ${showFilter === "events" ? "text-[#4B1EB4]" : "text-white"}`}>
              Events ({workshopsEvents.length})
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
            
            {/* Study Spot Markers - Green */}
            {displayedStudySpots.map((spot) => (
              <Marker
                key={`spot-${spot.id}`}
                coordinate={{
                  latitude: spot.location.latitude,
                  longitude: spot.location.longitude,
                }}
                title={spot.title}
                description={spot.address || "Study Spot"}
                pinColor="#10B981"
                onPress={() => setSelectedItem(spot)}
              />
            ))}
            
            {/* Workshop/Event Markers - Orange */}
            {displayedWorkshopsEvents.map((event) => (
              <Marker
                key={`event-${event.id}`}
                coordinate={{
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                }}
                title={event.title}
                description={event.address || "Workshop/Event"}
                pinColor="#F97316"
                onPress={() => setSelectedItem(event)}
              />
            ))}
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
            {"name" in selectedItem ? (
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
            ) : (
              /* Display for Study Spots */
              <>
                {/* Study Spot Icon */}
                <View className="w-full h-32 rounded-xl mb-3 bg-[#D1FAE5] items-center justify-center">
                  <Ionicons name="book" size={48} color="#10B981" />
                </View>

                {/* Study Spot Title */}
                <Text className="font-karla-bold text-[18px] text-[#18181B] mb-2">
                  {selectedItem.title}
                </Text>

                {/* Category Badge */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-[#D1FAE5] rounded-full px-3 py-1 flex-row items-center">
                    <Ionicons name="book-outline" size={16} color="#10B981" />
                    <Text className="text-[#10B981] text-[12px] font-karla-bold ml-1">
                      Study Spot
                    </Text>
                  </View>
                  {selectedItem.organizationVerified && (
                    <View className="bg-[#DBEAFE] rounded-full px-3 py-1 flex-row items-center ml-2">
                      <Ionicons name="checkmark-circle" size={14} color="#1D4ED8" />
                      <Text className="text-[#1D4ED8] text-[11px] font-karla-bold ml-1">
                        Verified
                      </Text>
                    </View>
                  )}
                </View>

                {/* Address */}
                {selectedItem.address && (
                  <View className="flex-row items-start mb-3">
                    <MaterialIcons name="location-on" size={18} color="#10B981" />
                    <Text className="ml-2 flex-1 text-[#18181B] text-[13px] font-karla">
                      {selectedItem.address}
                    </Text>
                  </View>
                )}

                {/* Availability - Highlighted */}
                {selectedItem.availability && (
                  <View className="bg-[#D1FAE5] rounded-xl p-3 mb-3">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="time" size={18} color="#10B981" />
                      <Text className="ml-2 font-karla-bold text-[14px] text-[#10B981]">
                        Availability
                      </Text>
                    </View>
                    <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                      {selectedItem.availability}
                    </Text>
                    {selectedItem.availabilityHours && (
                      <Text className="ml-7 text-[#18181B] text-[13px] font-karla-bold mt-1">
                        Hours: {selectedItem.availabilityHours}
                      </Text>
                    )}
                  </View>
                )}

                {/* Organization Info */}
                <View className="flex-row items-center mb-3">
                  <Ionicons name="business-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-[#6B7280] text-[13px] font-karla">
                    By {selectedItem.organizationName}
                  </Text>
                </View>

                {/* Description */}
                {selectedItem.description && (
                  <Text className="text-[#6B7280] text-[13px] font-karla mb-3">
                    {selectedItem.description}
                  </Text>
                )}
              </>
            ) : "startDate" in selectedItem ? (
              /* Display for Workshops/Events */
              <>
                {/* Event Icon */}
                <View className="w-full h-32 rounded-xl mb-3 bg-[#FED7AA] items-center justify-center">
                  <Ionicons name="calendar" size={48} color="#F97316" />
                </View>

                {/* Event Title */}
                <Text className="font-karla-bold text-[18px] text-[#18181B] mb-2">
                  {selectedItem.title}
                </Text>

                {/* Category Badge */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-[#FED7AA] rounded-full px-3 py-1 flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#F97316" />
                    <Text className="text-[#F97316] text-[12px] font-karla-bold ml-1">
                      {selectedItem.category}
                    </Text>
                  </View>
                  {selectedItem.organizationVerified && (
                    <View className="bg-[#DBEAFE] rounded-full px-3 py-1 flex-row items-center ml-2">
                      <Ionicons name="checkmark-circle" size={14} color="#1D4ED8" />
                      <Text className="text-[#1D4ED8] text-[11px] font-karla-bold ml-1">
                        Verified
                      </Text>
                    </View>
                  )}
                </View>

                {/* Address */}
                {selectedItem.address && (
                  <View className="flex-row items-start mb-3">
                    <MaterialIcons name="location-on" size={18} color="#F97316" />
                    <Text className="ml-2 flex-1 text-[#18181B] text-[13px] font-karla">
                      {selectedItem.address}
                    </Text>
                  </View>
                )}

                {/* Date Range - Highlighted */}
                {(selectedItem.startDate || selectedItem.endDate) && (
                  <View className="bg-[#FED7AA] rounded-xl p-3 mb-3">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="calendar" size={18} color="#F97316" />
                      <Text className="ml-2 font-karla-bold text-[14px] text-[#F97316]">
                        Event Schedule
                      </Text>
                    </View>
                    {selectedItem.startDate && (
                      <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                        Start: {selectedItem.startDate}
                      </Text>
                    )}
                    {selectedItem.endDate && (
                      <Text className="ml-7 text-[#18181B] text-[13px] font-karla">
                        End: {selectedItem.endDate}
                      </Text>
                    )}
                  </View>
                )}

                {/* Organization Info */}
                <View className="flex-row items-center mb-3">
                  <Ionicons name="business-outline" size={16} color="#6B7280" />
                  <Text className="ml-2 text-[#6B7280] text-[13px] font-karla">
                    By {selectedItem.organizationName}
                  </Text>
                </View>

                {/* Description */}
                {selectedItem.description && (
                  <Text className="text-[#6B7280] text-[13px] font-karla mb-3">
                    {selectedItem.description}
                  </Text>
                )}
              </>
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
                    {organizations.length + studySpots.length + workshopsEvents.length} Locations
                  </Text>
                  <Text className="font-karla text-[12px] text-[#6B7280]">
                    Tap a pin to view details
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Legend */}
            <View className="mt-3 pt-3 border-t border-gray-200">
              <View className="flex-row flex-wrap gap-3">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#4B1EB4] mr-1.5" />
                  <Text className="font-karla text-[11px] text-[#6B7280]">
                    Orgs ({organizations.length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#10B981] mr-1.5" />
                  <Text className="font-karla text-[11px] text-[#6B7280]">
                    Study ({studySpots.length})
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-[#F97316] mr-1.5" />
                  <Text className="font-karla text-[11px] text-[#6B7280]">
                    Events ({workshopsEvents.length})
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
