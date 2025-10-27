import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, TextInputProps, View, TouchableOpacity } from "react-native";

interface SearchBarProps extends TextInputProps {
  onClear?: () => void;
  showClearButton?: boolean;
}

export function SearchBar({ onClear, showClearButton, ...props }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-white mt-[10px] p-0.5 rounded-full mb-3 w-full mx-auto border-gray-300 border">
      <Ionicons name="search-outline" size={20} style={{ marginLeft: 10 }} />
      <TextInput
        className="ml-1 flex-1 font-karla text-[13px]"
        placeholder="Search for scholarships, study spaces, etc..."
        placeholderTextColor="#888"
        {...props}
      />
      {showClearButton && props.value && (
        <TouchableOpacity
          onPress={onClear}
          className="mr-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color="#888" />
        </TouchableOpacity>
      )}
    </View>
  );
}
