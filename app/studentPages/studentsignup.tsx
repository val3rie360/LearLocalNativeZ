import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signUp } from "../../services/authServices";

export default function StudentSignup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(""); // Clear previous error

    // Trim all fields before validation
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (
      !trimmedName ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      setError("Please fill in all fields");
      return;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!accepted) {
      setError("Please accept the terms and conditions");
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting to register student with email:", trimmedEmail);
      await signUp(trimmedEmail, trimmedPassword, "student", {
        name: trimmedName,
      });
      console.log("Student registered successfully");
      router.replace("/studentPages/(tabs)/Home");
    } catch (error: any) {
      console.error("Error registering student:", error);
      if (error.code === "auth/email-already-in-use") {
        setError(
          "This email is already registered. Please use a different email or try logging in."
        );
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else {
        setError(`Registration failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <View className="flex-1 bg-secondary">
        {/* Top Section */}
        <View className="bg-[#4B1EB4] pt-14 pb-6 px-6">
          <Text className="text-white text-[33px] font-karla-bold mb-1">
            Hello!
          </Text>
          <Text className="text-[#E0D7FF] text-base font-karla">
            Create an account
          </Text>
        </View>
        {/* Card Section */}
        <LinearGradient
          colors={["#fff", "#e5e0ff"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            marginHorizontal: 0,
            marginTop: 0,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
            flex: 1,
          }}
        >
          <Text className="text-[24px] font-karla-bold text-[#4B1EB4] mb-6">
            Sign Up
          </Text>
          {/* Error Message */}
          {error ? (
            <Text className="text-red-500 text-sm mb-4">{error}</Text>
          ) : null}
          {/* Name */}
          <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
            <Feather
              name="user"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-base font-karla text-[#222]"
              placeholder="Name"
              placeholderTextColor="#A1A1AA"
              value={name}
              onChangeText={setName}
            />
          </View>
          {/* Email */}
          <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
            <Feather
              name="mail"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-base font-karla text-[#222]"
              placeholder="Email"
              placeholderTextColor="#A1A1AA"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
          {/* Password */}
          <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
            <Feather
              name="lock"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-base font-karla text-[#222]"
              placeholder="Password"
              placeholderTextColor="#A1A1AA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              keyboardType="default"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              className="p-1 ml-1"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              activeOpacity={1}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#A1A1AA"
              />
            </TouchableOpacity>
          </View>
          {/* Confirm Password */}
          <View className="flex-row items-center bg-white rounded-full px-4 mb-4 h-12 shadow border border-[#e0d7ff]">
            <Feather
              name="lock"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-base font-karla text-[#222]"
              placeholder="Confirm Password"
              placeholderTextColor="#A1A1AA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              keyboardType="default"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              className="p-1 ml-1"
              accessibilityLabel={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              activeOpacity={1}
            >
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#A1A1AA"
              />
            </TouchableOpacity>
          </View>
          {/* Terms Checkbox */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              className="mr-2"
              onPress={() => setAccepted((prev) => !prev)}
              activeOpacity={1}
              style={{
                width: 20,
                height: 20,
                borderWidth: 1.5,
                borderColor: "#4B1EB4",
                borderRadius: 4,
                backgroundColor: accepted ? "#4B1EB4" : "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {accepted && <Feather name="check" size={14} color="#fff" />}
            </TouchableOpacity>
            <Text className="text-xs text-[#4B1EB4] font-karla">
              I have accepted the terms and conditions
            </Text>
          </View>
          {/* Register Button */}
          <TouchableOpacity
            className="bg-[#4B1EB4] rounded-full py-3 items-center mb-6 shadow-md"
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text className="text-white text-base font-karla-bold">
              {loading ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
          {/* Sign In Link */}
          <View className="flex-row justify-center items-center mb-2">
            <Text className="text-secondary font-karla text-sm">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text className="text-[#4B1EB4] font-karla-bold text-sm underline">
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
