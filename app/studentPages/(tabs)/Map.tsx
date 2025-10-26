import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView from "../../../components/PlatformMap";

const Map = () => {
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
            placeholder="Search for a location..."
            placeholderTextColor="#605E8F"
          />
          <TouchableOpacity>
            <Ionicons name="close" size={22} color="#A1A1AA" className="mr-2" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons
            name="options-outline"
            size={22}
            color="#ffffffff"
            className="mr-4"
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View className="flex-1 mt-2 overflow-hidden">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 9.3077,
            longitude: 123.3054,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        />
      </View>

      {/* Info Card */}
      <View className="absolute bottom-0 rounded-2xl left-0 right-0 ">
        <View className="bg-white shadow p-3">
          <Image
            source={require("../../../assets/images/pb.jpg")}
            className="w-full h-32 rounded-xl mb-3"
            resizeMode="cover"
          />
          <Text className="font-karla-bold text-[17px] text-[#18181B] mb-1">
            Public Library <Text className="text-[#FBBF24]">★</Text>
          </Text>
          <View className="flex-row items-center mb-1">
            <View className="bg-[#A7F3D0] rounded-full px-2 py-0.5 mr-2">
              <Text className="text-[#15803D] text-[12px] font-karla-bold">
                Open
              </Text>
            </View>
            <Text className="text-[#6B7280] text-[12px] font-karla">
              8:00 AM to 6:00 PM
            </Text>
          </View>
          <View className="flex-row items-center mb-1">
            <MaterialIcons name="location-on" size={16} color="#4B1EB4" />
            <Text className="ml-1 text-[#18181B] text-[13px] font-karla">
              Address: 8835+WRJ, Colon St, Dumaguete City, Negros Oriental
            </Text>
          </View>
          <Text className="ml-6 text-[#6B7280] text-[12px] font-karla">
            Located in: Dumaguete City Hall
          </Text>
          <TouchableOpacity className="bg-[#4B1EB4] rounded-full py-3 mt-4 flex-row items-center justify-center">
            <Ionicons name="navigate" size={20} color="#fff" className="mr-2" />
            <Text className="text-white font-karla-bold text-[16px]">
              Directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Map;
