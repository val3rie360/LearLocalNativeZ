import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const files = [
  { id: "1", title: "Math for Kids", date: "08/09/25", size: "5.2 MB" },
  { id: "2", title: "Genetics & Heredity", date: "08/09/25", size: "5.2 MB" },
  { id: "3", title: "Creative Writing 101", date: "08/09/25", size: "5.2 MB" },
  { id: "4", title: "World History", date: "08/09/25", size: "5.2 MB" },
  { id: "5", title: "Health and Fitness", date: "08/09/25", size: "5.2 MB" },
  { id: "6", title: "Coding for Kids", date: "08/09/25", size: "5.2 MB" },
];

const FileCard = ({
  title,
  date,
  size,
}: {
  title: string;
  date: string;
  size: string;
}) => (
  <View className="bg-white rounded-2xl p-4 items-center m-2 flex-1 min-w-[140px] max-w-[48%] shadow-md">
    <Feather name="file" size={48} color="#6C63FF" className="mb-3" />
    <Text
      className="text-[15px] font-karla-bold text-[#222] mb-1 text-center"
      numberOfLines={1}
    >
      {title}
    </Text>
    <Text className="text-xs text-[#888] text-center font-karla">
      {date} | {size}
    </Text>
  </View>
);

export default function DownloadsPage() {
  const router = useRouter();
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
            Downloads
          </Text>
        </View>
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-3xl px-4 h-11 mb-4.5 border border-[#ECECEC]">
          <Feather name="search" size={18} color="#000000ff" className="mr-2" />
          <TextInput
            className="flex-1 text-[15px] text-[#222] font-karla"
            placeholder="Search for learning materials..."
            placeholderTextColor="#B0B0B0"
          />
        </View>
        <View className="h-px bg-[#ECECEC] w-full my-2" />

        {/* Section Title */}
        <View className="flex-row items-center justify-between mb-2 mt-2">
          <Text className="text-[18px] font-karla-bold text-[#222]">
            Your files
          </Text>
          <TouchableOpacity>
            <Feather name="settings" size={20} color="#6C63FF" />
          </TouchableOpacity>
        </View>

        {/* Files Grid */}
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <FileCard title={item.title} date={item.date} size={item.size} />
          )}
          ListFooterComponent={
            <Text className="text-center text-[#888] mt-6 text-[14px] font-karla">
              No more files to show.
            </Text>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}
