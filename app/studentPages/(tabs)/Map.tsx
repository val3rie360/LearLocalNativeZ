import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "../../../components/PlatformMap";
import { getOrganizationsWithLocations } from "../../../services/firestoreService";

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
}

const Map = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const orgs = await getOrganizationsWithLocations();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Error loading organizations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Search organizations..."
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
        <TouchableOpacity onPress={loadOrganizations}>
          <Ionicons
            name="refresh-outline"
            size={22}
            color="#ffffffff"
            className="mr-4"
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1 mt-2 overflow-hidden">
        {loading ? (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <ActivityIndicator size="large" color="#4B1EB4" />
            <Text className="mt-2 text-gray-600 font-karla">Loading organizations...</Text>
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
            {filteredOrganizations.map((org) => (
              <Marker
                key={org.id}
                coordinate={{
                  latitude: org.location.latitude,
                  longitude: org.location.longitude,
                }}
                title={org.name}
                description={org.address || "Tap for details"}
                onPress={() => setSelectedOrg(org)}
              />
            ))}
          </MapView>
        )}
      </View>

      {/* Info Card - Shows when organization is selected */}
      {selectedOrg && (
        <View className="absolute bottom-0 rounded-t-2xl left-0 right-0">
          <View className="bg-white shadow-lg p-4">
            {/* Close button */}
            <TouchableOpacity
              onPress={() => setSelectedOrg(null)}
              className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="close" size={20} color="#18181B" />
            </TouchableOpacity>

            {/* Organization Photo */}
            {selectedOrg.photoURL ? (
              <Image
                source={{ uri: selectedOrg.photoURL }}
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
              {selectedOrg.name}
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
            {selectedOrg.address && (
              <View className="flex-row items-start mb-3">
                <MaterialIcons name="location-on" size={18} color="#4B1EB4" />
                <Text className="ml-2 flex-1 text-[#18181B] text-[13px] font-karla">
                  {selectedOrg.address}
                </Text>
              </View>
            )}

            {/* Description */}
            {selectedOrg.description && (
              <Text className="text-[#6B7280] text-[13px] font-karla mb-3">
                {selectedOrg.description}
              </Text>
            )}

            {/* Contact */}
            {selectedOrg.email && (
              <View className="flex-row items-center mb-3">
                <Ionicons name="mail" size={16} color="#4B1EB4" />
                <Text className="ml-2 text-[#18181B] text-[13px] font-karla">
                  {selectedOrg.email}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 bg-[#4B1EB4] rounded-full py-3 flex-row items-center justify-center">
                <Ionicons name="navigate" size={20} color="#fff" className="mr-2" />
                <Text className="text-white font-karla-bold text-[15px]">
                  Directions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#E5E0FF] rounded-full py-3 flex-row items-center justify-center">
                <Ionicons name="information-circle" size={20} color="#4B1EB4" className="mr-2" />
                <Text className="text-[#4B1EB4] font-karla-bold text-[15px]">
                  View Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Stats Info - Show when no organization is selected */}
      {!selectedOrg && !loading && (
        <View className="absolute bottom-4 left-4 right-4">
          <View className="bg-white rounded-xl shadow-lg p-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-[#4B1EB4] rounded-full p-2">
                <Ionicons name="business" size={20} color="#fff" />
              </View>
              <View className="ml-3">
                <Text className="font-karla-bold text-[15px] text-[#18181B]">
                  {organizations.length} Organizations
                </Text>
                <Text className="font-karla text-[12px] text-[#6B7280]">
                  Tap a pin to view details
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Map;
