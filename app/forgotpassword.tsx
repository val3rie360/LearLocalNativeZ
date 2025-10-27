import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { initiatePasswordReset } from "../services/forgotPasswordService";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
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
      const result = await initiatePasswordReset(email.trim());
      setEmailSent(true);

      Alert.alert(
        "Email Sent",
        "A password reset link has been sent to your email address. Please check your inbox and spam folder, then follow the instructions to reset your password.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 bg-[#E5E0FF]">
            {/* Top Purple Section */}
            <View className="bg-secondary pt-32 pb-8 pl-6">
              <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-12 left-6 z-10"
              >
                <Feather name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-[33px] font-karla-bold mb-0">
                Forgot Password?
              </Text>
              <Text className="text-[#E0D7FF] text-[15px] font-karla mb-10 text-left">
                Enter your email to reset your password
              </Text>
            </View>

            {/* White Card Section */}
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
              {!emailSent ? (
                <>
                  <Text className="text-[22px] font-karla-bold text-secondary mb-2">
                    Reset Password
                  </Text>
                  <Text className="text-[15px] font-karla text-[#666] mb-6">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </Text>

                  {/* Error Message */}
                  {error ? (
                    <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <Text className="text-red-600 text-sm font-karla">
                        {error}
                      </Text>
                    </View>
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
                      placeholder="Email Address"
                      placeholderTextColor="#A1A1AA"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>

                  {/* Send Reset Email Button */}
                  <TouchableOpacity
                    className="bg-secondary rounded-full py-3 items-center mb-4 shadow-md"
                    onPress={handleSendResetEmail}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white text-[17px] font-karla-bold">
                        Send Reset Link
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="items-center mb-6">
                    <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
                      <Feather name="check" size={32} color="#10B981" />
                    </View>
                    <Text className="text-[22px] font-karla-bold text-secondary mb-2">
                      Email Sent!
                    </Text>
                    <Text className="text-[15px] font-karla text-[#666] text-center">
                      We've sent a password reset link to {email}
                    </Text>
                  </View>

                  <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <Text className="text-blue-800 text-sm font-karla mb-2">
                      <Text className="font-karla-bold">Next Steps:</Text>
                    </Text>
                    <Text className="text-blue-700 text-sm font-karla">
                      1. Check your email inbox{"\n"}
                      2. Look for an email from LearnLocal{"\n"}
                      3. Click the reset link in the email{"\n"}
                      4. Follow the instructions to set a new password{"\n"}
                      5. Return to the app and login with your new password
                    </Text>
                  </View>

                  <TouchableOpacity
                    className="bg-secondary rounded-full py-3 items-center mb-4 shadow-md"
                    onPress={() => router.replace("/login")}
                  >
                    <Text className="text-white text-[17px] font-karla-bold">
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Back to Login */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-secondary font-karla text-[13px]">
                  Remember your password?{" "}
                </Text>
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text className="text-secondary font-karla-bold text-[13px] underline">
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
