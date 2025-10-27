import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signIn } from "../services/authServices";
import {
  signInWithFacebook,
  signInWithGoogle,
} from "../services/socialAuthServices";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Note: Redirection is now handled by the global routing logic in _layout.tsx
  // This ensures consistent role-based routing across the entire app

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password.trim());
      // Redirection will be handled by useEffect when profile data loads
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // Redirection will be handled by useEffect when profile data loads
    } catch (error) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithFacebook();
      // Redirection will be handled by useEffect when profile data loads
    } catch (error) {
      setError("Facebook sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <View className="flex-1 bg-[#E5E0FF]">
        {/* Top Purple Section */}
        <View className="bg-secondary pt-32 pb-8 pl-6">
          <Text className="text-white text-[33px] font-karla-bold mb-0">
            Welcome Back!
          </Text>
          <Text className="text-[#E0D7FF] text-[15px] font-karla mb-10 text-left">
            Login to your account
          </Text>
        </View>

        {/* white Card Section */}
        <LinearGradient
          colors={["#fff", "#e5e0ff"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            marginHorizontal: 0,
            marginTop: -28,
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
          <Text className="text-[22px] font-karla-bold text-secondary mb-4">
            Login
          </Text>
          {/* Error Message */}
          {error ? (
            <Text className="text-red-500 text-sm mb-4">{error}</Text>
          ) : null}
          {/* Email Input */}
          <View className="flex-row items-center bg-[#F5F3FF] rounded-full px-3.5 mb-4 h-12 shadow-sm border border-[#e0d7ff]">
            <Feather
              name="mail"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-[15px] font-karla text-[#222]"
              placeholder="Email"
              placeholderTextColor="#A1A1AA"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
          {/* Password Input */}
          <View className="flex-row items-center bg-[#F5F3FF] rounded-full px-3.5 mb-4 h-12 shadow-sm border border-[#e0d7ff]">
            <Feather
              name="lock"
              size={18}
              color="#A1A1AA"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-[15px] font-karla text-[#222]"
              placeholder="Password"
              placeholderTextColor="#A1A1AA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              className="p-1 ml-1"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              activeOpacity={1} // Prevents opacity change on press
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#A1A1AA"
              />
            </TouchableOpacity>
          </View>
          {/* Forgot Password */}
          <TouchableOpacity
            className="self-end mb-4"
            onPress={() => router.push("/forgotpassword")}
          >
            <Text className="text-secondary text-[13px] font-karla-bold opacity-85 underline">
              Forgot Password?
            </Text>
          </TouchableOpacity>
          {/* Login Button */}
          <TouchableOpacity
            className="bg-secondary rounded-full py-3 items-center mb-4 shadow-md"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white text-[17px] font-karla-bold">
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>
          {/* Or Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-secondary" />
            <Text className="mx-2 text-secondary font-karla text-[13px]">
              Or continue with
            </Text>
            <View className="flex-1 h-px bg-secondary" />
          </View>
          {/* Social Buttons */}
          <View className="flex-row justify-center mb-4 space-x-4">
            <TouchableOpacity
              className="bg-white rounded-xl p-2 shadow mr-4"
              onPress={handleFacebookLogin}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/fb.png")}
                className="w-8 h-8"
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white rounded-xl p-2 shadow"
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/google.png")}
                className="w-8 h-8"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* Sign Up */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-secondary font-karla text-[13px]">
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/usertype")}>
              <Text className="text-secondary font-karla-bold text-[13px] underline">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
