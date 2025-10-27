import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]">
      <View className="flex-1 px-5">
        {/* Back Arrow */}
        <TouchableOpacity
          className="mt-9 mb-2 w-8"
          hitSlop={10}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="font-karla-bold text-[26px] text-[#18181B] mb-4">
          Settings
        </Text>

        {/* Test Content */}
        <View className="flex-1 justify-center items-center">
          <Text className="font-karla text-[18px] text-[#18181B] text-center">
            Settings page is working! 🎉
          </Text>
          <Text className="font-karla text-[14px] text-[#6B7280] text-center mt-2">
            Navigation from profile pages is now functional.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}