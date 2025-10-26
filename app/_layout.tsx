import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { getUserProfile } from "../services/firestoreService";
import "./globals.css";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const roleRetryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roleFetchAttempts = useRef(0);

  // Fetch user role when user is authenticated
  useEffect(() => {
    let isActive = true;

    if (roleRetryTimeout.current) {
      clearTimeout(roleRetryTimeout.current);
      roleRetryTimeout.current = null;
    }
    roleFetchAttempts.current = 0;

    const fetchUserRole = async () => {
      if (!isActive) return;

      if (!user?.uid) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      if (roleFetchAttempts.current === 0) {
        setRoleLoading(true);
      }

      try {
        const profile = await getUserProfile(user.uid);

        if (!isActive) return;

        if (profile?.role) {
          setUserRole(profile.role);
          setRoleLoading(false);
        } else if (roleFetchAttempts.current < 5) {
          roleFetchAttempts.current += 1;
          roleRetryTimeout.current = setTimeout(fetchUserRole, 400);
        } else {
          setUserRole(null);
          setRoleLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);

        if (!isActive) return;

        if (roleFetchAttempts.current < 5) {
          roleFetchAttempts.current += 1;
          roleRetryTimeout.current = setTimeout(fetchUserRole, 400);
        } else {
          setUserRole(null);
          setRoleLoading(false);
        }
      }
    };

    fetchUserRole();

    return () => {
      isActive = false;
      if (roleRetryTimeout.current) {
        clearTimeout(roleRetryTimeout.current);
        roleRetryTimeout.current = null;
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    // Don't do any redirects until both auth and role are loaded
    if (loading || roleLoading) {
      console.log("Still loading auth or role data...");
      return;
    }

    const currentRoute = segments[0];
    const isOnProtectedStudentPages =
      currentRoute === "studentPages" && segments[1] === "(tabs)";
    const isOnProtectedOrgPages =
      currentRoute === "orgPages" && segments[1] === "(tabs)";
    const isOnAdminPage =
      currentRoute === "adminPages" && segments[1] === "admin";
    const isOnAuthPages =
      currentRoute === "login" ||
      (currentRoute === "studentPages" && segments[1] === "studentsignup") ||
      (currentRoute === "orgPages" && segments[1] === "orgsignup");

    // Redirect unauthenticated users from protected pages to login
    if (
      !user &&
      (isOnProtectedStudentPages || isOnProtectedOrgPages || isOnAdminPage)
    ) {
      console.log(
        "Redirecting unauthenticated user from protected pages to login"
      );
      router.replace("/login");
    }
    // Redirect authenticated users from auth pages to appropriate home based on role
    else if (user && userRole && isOnAuthPages) {
      const homeRoute =
        userRole === "admin"
          ? "/adminPages/admin"
          : userRole === "organization"
            ? "/orgPages/(tabs)/OrgHome"
            : "/studentPages/(tabs)/Home";
      console.log(
        `Redirecting authenticated ${userRole} user from auth pages to ${homeRoute}`
      );
      router.replace(homeRoute);
    }
    // Redirect users to correct pages based on their role
    else if (user && userRole) {
      if (userRole === "admin" && !isOnAdminPage) {
        console.log("Redirecting admin user to admin page");
        router.replace("/adminPages/admin");
      } else if (userRole === "organization" && isOnProtectedStudentPages) {
        console.log(
          "Redirecting organization user from student pages to org pages"
        );
        router.replace("/orgPages/(tabs)/OrgHome");
      } else if (userRole === "student" && isOnProtectedOrgPages) {
        console.log("Redirecting student user from org pages to student pages");
        router.replace("/studentPages/(tabs)/Home");
      }
    }
  }, [user, loading, userRole, roleLoading, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fadeAnim] = useState(new Animated.Value(0));

  const [fontsLoaded] = useFonts({
    "Karla-Bold": require("../assets/fonts/Karla-Bold.ttf"),
    Karla: require("../assets/fonts/Karla-Regular.ttf"),
    "Karla-Italic": require("../assets/fonts/Karla-Italic.ttf"),
  });
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log("Font loading timeout - proceeding anyway");
      setAppReady(true);
      SplashScreen.hideAsync();
    }, 5000); // 5 second fallback

    if (fontsLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setAppReady(true);
          SplashScreen.hideAsync();
        }, 2000); // 2 seconds after fade-in
      });
    }

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fadeAnim]);

  if (!appReady) {
    return (
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#3D0DBD",
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeAnim, // animated opacity
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#3D0DBD",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={require("../assets/images/learl.png")}
            style={{ width: 90, height: 90, marginBottom: 24 }}
            resizeMode="contain"
          />
          <Text
            style={{
              color: "#FFF065",
              fontSize: 32,
              fontFamily: "Karla-Bold",
              marginBottom: 8,
            }}
          >
            LearnLocal
          </Text>
          <Text
            style={{
              color: "#FFF065",
              fontSize: 16,
              fontFamily: "Karla-Bold",
              opacity: 0.85,
            }}
          >
            Learning starts where you are.
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
