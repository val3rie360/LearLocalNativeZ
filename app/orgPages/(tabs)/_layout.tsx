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
      <Tabs.Screen //-------- HOME
        name={"OrgHome"}
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
              style={{
                color: focused ? "#5048A6" : "black",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              Home
            </Text>
          ),
        }}
      />

      <Tabs.Screen //-------- BOARD
        name={"OrgBoard"}
        options={{
          tabBarIcon: ({ focused }) => (
            <AntDesign
              name="appstore"
              size={25}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#5048A6" : "black",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              Board
            </Text>
          ),
        }}
      />

      <Tabs.Screen //-------- CREATE
        name={"OrgCreate"}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                marginBottom: 20,
                width: 66, // bigger than inner
                height: 66,
                borderRadius: 100,
                backgroundColor: "white", // outline color
                justifyContent: "center",
                borderWidth: 2, // thickness of outline
                borderColor: "white", // outline color
                alignItems: "center",
              }}
            >
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
                <Feather name="plus" size={30} color="white" />
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen //-------- UPLOADS
        name={"OrgUploads"}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather
              name="upload"
              size={26}
              color={focused ? "#5048A6" : "black"}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#5048A6" : "black",
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              Uploads
            </Text>
          ),
        }}
      />

      <Tabs.Screen //-------- PROFILE
        name={"OrgProfile"}
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
              style={{
                color: focused ? "#5048A6" : "black",
                fontSize: 10,
                fontWeight: "bold",
              }}
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
