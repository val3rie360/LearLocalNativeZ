import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, TextInputProps, View } from "react-native";

export function SearchBar(props: TextInputProps) {
  return (
    <View className="flex-row items-center bg-white mt-[10px] p-0.5 rounded-full mb-3 w-full mx-auto border-gray-300 border">
      <Ionicons name="search-outline" size={20} style={{ marginLeft: 10 }} />
      <TextInput
        className="ml-1 flex-1 font-karla text-[13px]"
        placeholder="Search for scholarships, study spaces, etc..."
        placeholderTextColor="#888"
        {...props}
      />
    </View>
  );
}
