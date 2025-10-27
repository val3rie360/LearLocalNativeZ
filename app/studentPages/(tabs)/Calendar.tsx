import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar as RNCalendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getUnreadDeadlineNotifications,
  getUpcomingDeadlines,
  markNotificationAsRead,
  syncTrackedOpportunityDeadlines,
} from "../../../services/firestoreService";

interface Deadline {
  date: Date;
  title: string;
  milestoneDescription: string;
  opportunityId: string;
  specificCollection: string;
  category: string;
}

// Category styling configuration
const getCategoryStyle = (category: string) => {
  const styles: Record<
    string,
    { tagColor: string; tagText: string; dotColor: string }
  > = {
    "Scholarship / Grant": {
      tagColor: "bg-[#D1FAFF]",
      tagText: "text-[#0CA5E9]",
      dotColor: "#0CA5E9",
    },
    "Competition / Event": {
      tagColor: "bg-[#FECACA]",
      tagText: "text-[#B91C1C]",
      dotColor: "#B91C1C",
    },
    "Workshop / Seminar": {
      tagColor: "bg-[#FEF3C7]",
      tagText: "text-[#F59E0B]",
      dotColor: "#F59E0B",
    },
    "Study Spot": {
      tagColor: "bg-[#E0E7FF]",
      tagText: "text-[#4F46E5]",
      dotColor: "#4F46E5",
    },
  };

  return (
    styles[category] || {
      tagColor: "bg-[#E5E7EB]",
      tagText: "text-[#6B7280]",
      dotColor: "#6B7280",
    }
  );
};

const SELECTED_COLOR = "#4B1EB4";

const Calendar = () => {
  const router = useRouter();
  const { user } = useAuth();
  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notification management
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Cache management: Track last fetch timestamp
  const lastFetchTimestamp = useRef<number>(0);
  const lastSyncTimestamp = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds in milliseconds
  const SYNC_INTERVAL = 60000; // Sync every 60 seconds (1 minute)

  // Format date for display
  const formatDate = (date: Date): string => {
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  };

  // Format date for calendar marking (YYYY-MM-DD) - LOCAL TIMEZONE VERSION
  const formatDateForCalendar = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate days until deadline
  const getDaysUntil = (date: Date): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get urgency color based on days remaining
  const getUrgencyColor = (daysUntil: number): string => {
    if (daysUntil <= 3) return "#ff0a0aff"; // Red - Very urgent
    if (daysUntil <= 7) return "#F59E0B"; // Orange - Urgent
    if (daysUntil <= 14) return "#F4B740"; // Yellow - Moderate
    return "#6C63FF"; // Purple - Not urgent
  };

  // Fetch deadlines from Firestore with caching
  const fetchDeadlines = async (forceRefresh: boolean = false) => {
    if (!user?.uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Check if we should use cached data (unless force refresh)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimestamp.current;

    if (
      !forceRefresh &&
      timeSinceLastFetch < CACHE_DURATION &&
      deadlines.length > 0
    ) {
      console.log(
        "📦 Using cached deadlines (fetched",
        Math.round(timeSinceLastFetch / 1000),
        "seconds ago)"
      );
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Fetching fresh deadlines from Firestore");
      console.log("📍 User ID:", user.uid);

      // Fetch ALL upcoming deadlines (no limit)
      const upcomingDeadlines = await getUpcomingDeadlines(user.uid, 1000);

      console.log("📊 Fetched deadlines count:", upcomingDeadlines.length);
      if (upcomingDeadlines.length > 0) {
        console.log("📋 First deadline:", upcomingDeadlines[0]);
        console.log(
          "📋 All deadlines:",
          JSON.stringify(upcomingDeadlines, null, 2)
        );
      } else {
        console.log("⚠️ No upcoming deadlines found - Check:");
        console.log("  1. Are any opportunities tracked?");
        console.log("  2. Do opportunities have dateMilestones?");
        console.log("  3. Are the dates in the future?");
      }

      setDeadlines(upcomingDeadlines);
      console.log(
        "✅ State updated with",
        upcomingDeadlines.length,
        "deadlines"
      );
      lastFetchTimestamp.current = Date.now();
    } catch (error) {
      console.error("❌ Error fetching deadlines:", error);
      setDeadlines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchDeadlines(true); // Force refresh on initial mount
  }, [user?.uid]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    try {
      const unreadNotifications = await getUnreadDeadlineNotifications(
        user.uid
      );
      setNotifications(unreadNotifications);

      if (unreadNotifications.length > 0) {
        console.log(
          `📬 Found ${unreadNotifications.length} unread notification(s)`
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  // Background sync: Check for deadline changes
  const performBackgroundSync = async (forceSync: boolean = false) => {
    if (!user?.uid) {
      return;
    }

    // Check if we should sync (avoid too frequent syncs)
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTimestamp.current;

    if (!forceSync && timeSinceLastSync < SYNC_INTERVAL) {
      console.log(
        `⏭️ Skipping sync (last synced ${Math.round(timeSinceLastSync / 1000)}s ago)`
      );
      return;
    }

    try {
      setIsSyncing(true);
      console.log("🔄 Starting background sync for deadline changes...");

      // Sync tracked opportunities for changes
      const changesCount = await syncTrackedOpportunityDeadlines(user.uid);

      if (changesCount > 0) {
        console.log(`✓ Sync complete: ${changesCount} change(s) detected`);
        // Refresh notifications to show new changes
        await fetchNotifications();
        // Refresh deadlines to show updated dates
        await fetchDeadlines(true);
      } else {
        console.log("✓ Sync complete: No changes detected");
      }

      lastSyncTimestamp.current = Date.now();
    } catch (error) {
      console.error("Error during background sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-refresh when Calendar tab comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("📅 Calendar tab focused - checking for updates");

      // Don't force refresh, use cache if available
      fetchDeadlines(false);

      // Fetch notifications
      fetchNotifications();

      // Perform background sync to check for deadline changes
      // This runs in background and doesn't block the UI
      performBackgroundSync(false);
    }, [user?.uid])
  );

  // Pull-to-refresh handler (forces refresh)
  const onRefresh = async () => {
    setRefreshing(true);

    // Force sync when user manually refreshes
    await performBackgroundSync(true);

    // Then fetch fresh data
    await fetchDeadlines(true);
    await fetchNotifications();

    setRefreshing(false);
  };

  // Handle notification dismissal
  const handleDismissNotifications = async () => {
    if (!user?.uid) return;

    try {
      // Mark all notifications as read
      for (const notification of notifications) {
        await markNotificationAsRead(user.uid, notification.id);
      }

      // Clear local state
      setNotifications([]);
      setShowNotificationModal(false);

      console.log("✓ All notifications marked as read");
    } catch (error) {
      console.error("Error dismissing notifications:", error);
    }
  };

  // Format date for notification display
  const formatNotificationDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to get category color
  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("competition")) {
      return "#FBBF24"; // Yellow
    } else if (
      categoryLower.includes("scholarship") ||
      categoryLower.includes("grant")
    ) {
      return "#3B82F6"; // Bright Blue
    } else if (categoryLower.includes("workshop")) {
      return "#10B981"; // Green
    } else if (categoryLower.includes("resource")) {
      return "#8B5CF6"; // Purple
    }
    return "#6B7280"; // Default Gray
  };

  // Build markedDates from fetched deadlines
  const markedDates: Record<string, any> = {};

  deadlines.forEach((deadline) => {
    const dateString = formatDateForCalendar(deadline.date);
    const daysUntil = getDaysUntil(deadline.date);

    // Determine color: Red for urgent (≤3 days), otherwise category color
    let markColor = getCategoryColor(deadline.category);
    if (daysUntil <= 3) {
      markColor = "#EF4444"; // Red for urgent
    }

    if (!markedDates[dateString]) {
      markedDates[dateString] = {
        marked: true,
        dotColor: markColor,
        customStyles: {
          container: {
            backgroundColor: markColor + "20", // 20% opacity for background circle
            borderRadius: 50,
            borderWidth: 2,
            borderColor: markColor,
          },
          text: {
            color: "#111827",
            fontWeight: "bold",
          },
        },
      };
    } else {
      // If multiple deadlines on same date, prioritize urgent (red)
      if (daysUntil <= 3) {
        markedDates[dateString].dotColor = "#EF4444";
        markedDates[dateString].customStyles.container.borderColor = "#EF4444";
        markedDates[dateString].customStyles.container.backgroundColor =
          "#EF444420";
      }
    }
  });

  // Always highlight the selected date
  if (markedDates[selectedDate]) {
    // If selected date has a deadline, enhance it with selection indicator
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      customStyles: {
        ...markedDates[selectedDate].customStyles,
        container: {
          ...markedDates[selectedDate].customStyles.container,
          borderWidth: 3, // Thicker border for selected
        },
        text: {
          ...markedDates[selectedDate].customStyles.text,
          fontWeight: "bold",
        },
      },
    };
  } else {
    // If selected date has no deadline, just show selection
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: SELECTED_COLOR,
    };
  }

  return (
    <SafeAreaView className="flex-1 bg-[#4B1EB4]" edges={["top"]}>
      <View className="flex-1">
        {/* Fixed Header Section - Sticky */}
        <View className="bg-[#4B1EB4]">
          {/* Title */}
          <View className="flex-row justify-between items-center px-6 mt-6 mb-4">
            <View className="flex-row items-center">
              <Text className="text-[26px] font-karla-bold text-white">
                Your Calendar
              </Text>
              {isSyncing && (
                <View className="ml-3 flex-row items-center bg-white/20 px-2 py-1 rounded-full">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-karla text-[11px] ml-1.5">
                    Syncing...
                  </Text>
                </View>
              )}
            </View>

            {/* Right side: Notifications + Deadlines count */}
            <View className="flex-row items-center">
              {/* Notification Icon - Always visible */}
              <TouchableOpacity
                className="mr-3 relative"
                onPress={() => {
                  console.log("Navigating to notifications page");
                  router.push("../notifications");
                }}
                activeOpacity={0.7}
              >
                <View className="bg-white/20 p-2 rounded-full">
                  <Ionicons name="notifications" size={20} color="#fff" />
                </View>
                {/* Badge - Only show if unread notifications */}
                {notifications.length > 0 && (
                  <View className="absolute -top-1 -right-1 bg-amber-400 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                    <Text className="text-white font-karla-bold text-[10px]">
                      {notifications.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Deadlines count */}
              {!loading && deadlines.length > 0 && (
                <View className="bg-white/20 px-3 py-1.5 rounded-full">
                  <Text className="text-white font-karla-bold text-[13px]">
                    {deadlines.length} deadline
                    {deadlines.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Calendar Card - Sticky */}
          <View className="bg-white rounded-2xl px-2 py-2 mx-4 mb-8 shadow-lg">
            <RNCalendar
              markedDates={markedDates}
              markingType="custom"
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                todayTextColor: "#000000ff",
                arrowColor: "#5d1c8fff",
                textDayFontFamily: "Karla",
                textMonthFontFamily: "Karla-Bold",
                textDayHeaderFontFamily: "Karla-Bold",
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
                calendarBackground: "#fff",
              }}
            />

            {/* Color Legend */}
            {deadlines.length > 0 && (
              <View className="flex-row  items-center mt-3 mb-1 flex-wrap px-2">
                <View className="flex-row items-center mr-3 mb-1">
                  <View className="w-3 h-3 rounded-full border-2 border-[#EF4444] bg-[#EF444420] mr-1.5" />
                  <Text className="text-[11px] font-karla text-[#6B7280]">
                    Urgent
                  </Text>
                </View>
                <View className="flex-row items-center mr-3 mb-1">
                  <View className="w-3 h-3 rounded-full border-2 border-[#3B82F6] bg-[#3B82F620] mr-1.5" />
                  <Text className="text-[11px] font-karla text-[#6B7280]">
                    Scholarship
                  </Text>
                </View>
                <View className="flex-row items-center mr-3 mb-1">
                  <View className="w-3 h-3 rounded-full border-2 border-[#FBBF24] bg-[#FBBF2420] mr-1.5" />
                  <Text className="text-[11px] font-karla text-[#6B7280]">
                    Competition
                  </Text>
                </View>
                <View className="flex-row items-center mb-1">
                  <View className="w-3 h-3 rounded-full border-2 border-[#10B981] bg-[#10B98120] mr-1.5" />
                  <Text className="text-[11px] font-karla text-[#6B7280]">
                    Workshop
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Scrollable Upcoming Deadlines Section Only */}
        <LinearGradient
          colors={["#fff", "#DADEFF"]}
          className="flex-1 rounded-t-[45px] mt-[-20px]"
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4B1EB4"
              />
            }
          >
            <View className="pt-7 px-5">
              <View className="flex-row items-center justify-center mb-5">
                <Text className="text-[20px] font-karla-bold text-[#111827]">
                  Upcoming Deadlines
                </Text>
              </View>

              {loading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#4B1EB4" />
                  <Text className="text-[#666] mt-2 font-karla">
                    Loading deadlines...
                  </Text>
                </View>
              ) : deadlines.length > 0 ? (
                <View>
                  {deadlines.map((item, idx) => {
                    const daysUntil = getDaysUntil(item.date);
                    const categoryStyle = getCategoryStyle(item.category);
                    const urgencyColor = getUrgencyColor(daysUntil);

                    return (
                      <View
                        key={`${item.opportunityId}-${idx}`}
                        className="mb-4"
                      >
                        <View className="flex-row items-start">
                          {/* Date Badge */}
                          <View className="w-[70px] mt-2">
                            <Text className="font-karla-bold text-[#655b7d] text-[15px]">
                              {formatDate(item.date)}
                            </Text>
                            <Text className="font-karla text-[11px] text-[#9CA3AF]">
                              {daysUntil === 0
                                ? "Today"
                                : daysUntil === 1
                                  ? "Tomorrow"
                                  : `${daysUntil} days`}
                            </Text>
                          </View>

                          {/* Deadline Card */}
                          <View
                            className="flex-1 bg-[#F9FAFB] rounded-xl px-4 py-3 shadow-sm"
                            style={{
                              borderLeftWidth: 4,
                              borderLeftColor: urgencyColor,
                            }}
                          >
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1">
                                {/* Milestone Description as Main Title */}
                                <Text className="text-[16px] font-karla-bold text-[#4B1EB4] mb-1">
                                  {item.milestoneDescription}
                                </Text>
                                {/* Opportunity Name as Subtext */}
                                <Text className="text-[13px] font-karla text-[#6B7280] mb-2">
                                  {item.title}
                                </Text>
                                <View className="flex-row items-center flex-wrap">
                                  <Text
                                    className={`text-[12px] font-karla-bold px-2 py-1 rounded-md ${categoryStyle.tagColor} ${categoryStyle.tagText} mr-2 mb-1`}
                                  >
                                    {item.category}
                                  </Text>
                                  {daysUntil <= 3 && (
                                    <View className="flex-row items-center bg-red-100 px-2 py-1 rounded-md mb-1">
                                      <Ionicons
                                        name="alert-circle"
                                        size={12}
                                        color="#B91C1C"
                                      />
                                      <Text className="text-[11px] font-karla-bold text-red-700 ml-1">
                                        URGENT
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <TouchableOpacity
                                className="ml-3 mt-1"
                                onPress={() =>
                                  router.push({
                                    pathname: "../opportunity",
                                    params: {
                                      id: item.opportunityId,
                                      specificCollection:
                                        item.specificCollection,
                                    },
                                  })
                                }
                              >
                                <Text className="font-karla-bold text-[14px] text-[#6C63FF]">
                                  View →
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="py-12 items-center px-8">
                  <Ionicons name="calendar-outline" size={64} color="#CCC" />
                  <Text className="text-[#666] font-karla-bold text-[18px] mt-4 text-center">
                    No Upcoming Deadlines
                  </Text>
                  <Text className="text-[#999] font-karla text-center mt-2">
                    Register to opportunities from the Home tab to track their
                    deadlines here.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/studentPages/(tabs)/Home")}
                    className="mt-4 px-6 py-3 bg-[#4B1EB4] rounded-lg"
                  >
                    <Text className="text-white font-karla-bold">
                      Explore Opportunities
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            {/* Modal Header */}
            <View className="border-b border-gray-200 p-5 flex-row items-center justify-between">
              <View>
                <Text className="text-[20px] font-karla-bold text-[#111827]">
                  Deadline Changes
                </Text>
                <Text className="text-[13px] font-karla text-[#6B7280] mt-0.5">
                  {notifications.length} opportunit
                  {notifications.length !== 1 ? "ies" : "y"} updated
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView className="flex-1">
              {notifications.map((notification, idx) => (
                <View
                  key={notification.id}
                  className={`p-5 ${idx < notifications.length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  {/* Opportunity Title */}
                  <View className="flex-row items-center mb-3">
                    <View className="bg-[#4B1EB4] rounded-lg p-2 mr-3">
                      <Ionicons name="calendar" size={16} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[16px] font-karla-bold text-[#111827]">
                        {notification.opportunityTitle}
                      </Text>
                      <Text className="text-[12px] font-karla text-[#6B7280]">
                        {notification.category}
                      </Text>
                    </View>
                  </View>

                  {/* Changes List */}
                  {notification.changes &&
                    notification.changes.map(
                      (change: any, changeIdx: number) => (
                        <View
                          key={changeIdx}
                          className="ml-11 mb-2 bg-gray-50 rounded-lg p-3"
                        >
                          <Text className="text-[13px] font-karla-bold text-[#374151] mb-1">
                            {change.description}
                          </Text>

                          {change.type === "changed" && (
                            <View>
                              <View className="flex-row items-center">
                                <Text className="text-[12px] font-karla text-[#6B7280]">
                                  From:{" "}
                                </Text>
                                <Text className="text-[12px] font-karla-bold text-red-600 line-through">
                                  {formatNotificationDate(change.oldDate)}
                                </Text>
                              </View>
                              <View className="flex-row items-center mt-0.5">
                                <Text className="text-[12px] font-karla text-[#6B7280]">
                                  To:{" "}
                                </Text>
                                <Text className="text-[12px] font-karla-bold text-green-600">
                                  {formatNotificationDate(change.newDate)}
                                </Text>
                              </View>
                            </View>
                          )}

                          {change.type === "added" && (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="add-circle"
                                size={14}
                                color="#10b981"
                              />
                              <Text className="text-[12px] font-karla text-green-600 ml-1">
                                New deadline:{" "}
                                {formatNotificationDate(change.newDate)}
                              </Text>
                            </View>
                          )}

                          {change.type === "removed" && (
                            <View className="flex-row items-center">
                              <Ionicons
                                name="remove-circle"
                                size={14}
                                color="#ef4444"
                              />
                              <Text className="text-[12px] font-karla text-red-600 ml-1">
                                Deadline removed
                              </Text>
                            </View>
                          )}
                        </View>
                      )
                    )}

                  {/* View Opportunity Button */}
                  <TouchableOpacity
                    className="ml-11 mt-2 flex-row items-center"
                    onPress={() => {
                      setShowNotificationModal(false);
                      router.push({
                        pathname: "../opportunity",
                        params: {
                          id: notification.opportunityId,
                          specificCollection: notification.specificCollection,
                        },
                      });
                    }}
                  >
                    <Text className="text-[13px] font-karla-bold text-[#4B1EB4]">
                      View Opportunity
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#4B1EB4"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Footer Actions */}
            <View className="border-t border-gray-200 p-4">
              <TouchableOpacity
                onPress={handleDismissNotifications}
                className="bg-[#4B1EB4] rounded-full py-3 items-center"
              >
                <Text className="text-white font-karla-bold text-[15px]">
                  Mark All as Read
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Calendar;
