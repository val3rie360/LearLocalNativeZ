import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { buttontxt, textu, textw, titlelg, titlereglg } from "../tsStyling";

export default function GetStarted() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-secondary items-center justify-center px-6">
      <View className="flex-row items-center">
        <Image
          source={require("../assets/images/learl.png")}
          className="w-[60px] h-[60px]"
        />
        <Text className={`${titlelg} text-[#FFE600]`}>LearnLocal</Text>
      </View>

      <Image
        source={require("../assets/images/gsimageLL.png")}
        className="w-[250px] h-[250px] mb-2 mt-[-1px]"
        resizeMode="contain"
      />

      <Text className={`${titlereglg} text-white mb-3`}>Your all-in-one</Text>
      <Text
        className={`${titlereglg} text-white text-center mt-[-15px] mb-3 leading-8`}
      >
        <Text className={`${titlelg} text-[#FFE600]`}>
          educational opportunity{"\n"} finder
        </Text>{" "}
        app
      </Text>
      <Text className={`${textw} text-center mb-8 opacity-90`}>
        Discover scholarships, workshops, study spots, and learning programs
        near you — all in one place.
      </Text>

      <TouchableOpacity
        className="bg-white rounded-3xl py-3 px-12 mb-4.5"
        onPress={() => router.replace("./usertype")}
      >
        <Text className={`${buttontxt} text-[#4B2ACF]`}>Get Started</Text>
      </TouchableOpacity>

      <Text className={`${textw} mt-3 text-center opacity-90`}>
        Already have an account?{" "}
        <Text
          className={`${textu} text-[#FFE600]`}
          onPress={() => router.replace("../login")}
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}
