import { useAuth } from "@/contexts/AuthContext";
import { addCommunityPost } from "@/services/firestoreService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  { label: "Scholarship", bg: "bg-[#BDFCFF]", text: "text-[#106074]" },
  { label: "Event", bg: "bg-[#FFC3C4]", text: "text-[#934055]" },
  { label: "Study Spot", bg: "bg-[#FFD6E0]", text: "text-[#C94F7C]" },
  { label: "Learning Materials", bg: "bg-[#F2C25B]", text: "text-[#745000]" },
  { label: "Workshop", bg: "bg-[#C6F7B2]", text: "text-[#3B7C1B]" },
];

export default function CreatePost() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const { profileData } = useAuth();
  const [desc, setDesc] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const wordCount =
    desc.trim().length > 0 ? desc.trim().split(/\s+/).length : 0;

  // Add this function to handle post creation
  const handlePost = async () => {
    if (!title.trim() || !selected) {
      Alert.alert("Please enter a title and select a category.");
      return;
    }
    if (wordCount > 25) {
      Alert.alert("Description cannot exceed 25 words.");
      return;
    }
    if (!profileData?.name) {
      Alert.alert("Error", "Could not find your user name.");
      return;
    }
    console.log("Posting as user:", profileData.name); // Debug line
    try {
      await addCommunityPost({
        user: profileData.name,
        date: new Date().toLocaleDateString("en-US"),
        title: title.trim(),
        desc: desc.trim(),
        tag: selected,
        upvotes: 0,
      });
      router.back();
    } catch (e) {
      Alert.alert("Failed to post. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#E6E4FA]">
      <View className="flex-1 px-5 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-8 mb-4">
          <TouchableOpacity
            className="w-8"
            hitSlop={10}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>
          <Text className="font-karla-bold text-[22px] text-[#18181B]">
            Create Post
          </Text>
          <TouchableOpacity
            className="bg-[#4B1EB4] rounded-full px-5 py-2"
            activeOpacity={0.8}
            onPress={handlePost} // <-- Add this
          >
            <Text className="text-white font-karla-bold text-[15px]">Post</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="h-[1px] bg-[#E5E0FF] mb-5" />

        {/* Title */}
        <Text className="font-karla-bold text-[15px] text-[#18181B] mb-2">
          Title
        </Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 text-[15px] font-karla text-[#18181B] mb-4 shadow"
          placeholder="Enter the title"
          placeholderTextColor="#A1A1AA"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text className="font-karla-bold text-[15px] text-[#18181B] mb-2">
          Description
        </Text>
        <View className="bg-white rounded-2xl px-4 pt-0 pb-7 mb-2 shadow">
          <TextInput
            className="text-[15px] font-karla text-[#18181B] min-h-[60px] max-h-[90px]"
            placeholder="Body (optional)"
            placeholderTextColor="#A1A1AA"
            value={desc}
            onChangeText={setDesc}
            multiline
            maxLength={200}
          />
          <Text
            className={`text-right text-[12px] font-karla mt-1 absolute bottom-2 right-4 ${
              wordCount > 25 ? "text-red-500" : "text-[#A1A1AA]"
            }`}
          >
            {wordCount}/25 words
          </Text>
        </View>

        {/* Category */}
        <Text className="font-karla-bold text-[15px] text-[#18181B] mb-2 mt-2">
          Category
        </Text>
        <View className="flex-row flex-wrap gap-x-2 gap-y-2">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              className={`px-3 py-1 rounded-full min-w-[120px] justify-center items-center ${cat.bg} ${selected === cat.label ? "border-2 border-[#4B1EB4]" : "border border-transparent"}`}
              onPress={() => setSelected(cat.label)}
              activeOpacity={0.8}
              style={{ alignItems: "center" }}
            >
              <Text
                className={`font-karla-bold text-[14px] text-center ${cat.text}`}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
