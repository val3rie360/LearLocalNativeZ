import { AntDesign, Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const _Layout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#F6EBEB",
        },
      }}
    >
      <Tabs.Screen
        name={"Home"}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather
              name="home"
              size={26}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className={`text-[10px] font-bold ${focused ? "text-[#5048A6]" : "text-black"}`}
            >
              Home
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name={"Library"}
        options={{
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="book"
              size={23}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className={`text-[10px] font-bold ${focused ? "text-[#5048A6]" : "text-black"}`}
            >
              Library
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name={"Map"}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View className="mb-5 w-[66px] h-[66px] rounded-full bg-white justify-center items-center border-2 border-white">
              <LinearGradient
                colors={["#836CEC", "#281E8D"]}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 100,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Feather name="map-pin" size={30} color="white" />
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name={"Calendar"}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather
              name="calendar"
              size={26}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className={`text-[10px] font-bold ${focused ? "text-[#5048A6]" : "text-black"}`}
            >
              Calendar
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name={"Profile"}
        options={{
          tabBarIcon: ({ focused }) => (
            <FontAwesome5
              name="user-circle"
              size={26}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className={`text-[10px] font-bold ${focused ? "text-[#5048A6]" : "text-black"}`}
            >
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default _Layout;
