import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
export default function UserType() {
  const [selected, setSelected] = useState<"student" | "org" | null>(null);
  const router = useRouter();
  const [isPressing, setIsPressing] = useState(false);

  const handleSelect = (type: "student" | "org") => {
    if (isPressing) return;
    setIsPressing(true);
    setSelected(type);
    setTimeout(() => setIsPressing(false), 400);
  };

  return (
    <View className="flex-1 bg-secondary items-center pt-20 px-5">
      {/* Logo */}
      <Image
        source={require("../assets/images/learl.png")}
        className="w-14 h-14 mb-3 self-center"
      />

      {/* Welcome */}
      <Text className="text-white text-xl mb-2 text-center font-karla-bold">
        Welcome to{" "}
        <Text className="text-yellow-400 text-xl font-karla-bold">
          LearnLocal
        </Text>
      </Text>
      <Text className="text-violet-100 font-karla text-base mb-8 text-center px-2">
        Tell us who you are so we can personalize your experience.
      </Text>

      {/* Cards */}
      <View className="flex-row justify-center mb-8 gap-4">
        <TouchableOpacity
          className={`bg-white rounded-xl py-8 px-4 items-center w-44 border-4 ${
            selected === "student" ? "border-yellow-400" : "border-transparent"
          }`}
          onPress={() => handleSelect("student")}
          activeOpacity={1}
        >
          <Ionicons
            name="school"
            size={48}
            color="#4B2ACF"
            style={{ marginBottom: 12 }}
          />
          <Text className="text-lg text-violet-950 mb-2 text-center font-karla-bold">
            I’m a Student
          </Text>
          <Text className="font-karla text-sm text-violet-800 text-center opacity-85">
            Discover scholarships, workshops, study spots, and learning programs
            near you.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`bg-white rounded-xl py-7 px-4 items-center w-44 border-4 ${
            selected === "org" ? "border-yellow-400" : "border-transparent"
          }`}
          onPress={() => handleSelect("org")}
          activeOpacity={1}
        >
          <FontAwesome5
            name="school"
            size={48}
            color="#4B2ACF"
            style={{ marginBottom: 12 }}
          />
          <Text className="text-lg text-violet-950 mb-2 text-center font-karla-bold">
            I’m an Organization
          </Text>
          <Text className="font-karla text-sm text-violet-800 text-center opacity-85">
            Share your programs and connect with students in your community.
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        className={`bg-white rounded-full py-3 px-12 self-center mt-1 mb-4 ${
          selected ? "opacity-100" : "opacity-50"
        }`}
        disabled={!selected}
        onPress={() => {
          console.log("Continue button pressed, selected:", selected);
          if (selected === "student") {
            console.log("Navigating to student signup");
            router.replace("/studentPages/studentsignup");
          } else if (selected === "org") {
            console.log("Navigating to org signup");
            router.replace("/orgPages/orgsignup");
          }
        }}
      >
        <Text className="text-violet-800 text-lg text-center font-karla-bold">
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}
