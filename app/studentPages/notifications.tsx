import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebaseconfig";
import { getUpcomingDeadlines, markNotificationAsRead } from "../../services/firestoreService";

interface DeadlineNotification {
  id: string;
  type: string;
  opportunityId: string;
  opportunityTitle: string;
  category: string;
  specificCollection?: string;
  changes: Array<{
    type: 'changed' | 'added' | 'removed';
    description: string;
    oldDate?: number;
    newDate?: number;
  }>;
  read: boolean;
  createdAt: any;
}

interface TodayDeadline {
  opportunityId: string;
  title: string;
  milestoneDescription: string;
  date: Date;
  category: string;
  specificCollection: string;
}

export default function Notifications() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
  const [todayDeadlines, setTodayDeadlines] = useState<TodayDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  console.log("Notifications page loaded");

  const toggleGroup = (opportunityId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [opportunityId]: !prev[opportunityId],
    }));
  };

  // Fetch today's deadlines
  const fetchTodayDeadlines = async () => {
    if (!user?.uid) return;

    try {
      const allDeadlines = await getUpcomingDeadlines(user.uid, 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysDeadlines = allDeadlines.filter(deadline => {
        const deadlineDate = new Date(deadline.date);
        deadlineDate.setHours(0, 0, 0, 0);
        return deadlineDate.getTime() === today.getTime();
      });
      
      setTodayDeadlines(todaysDeadlines);
    } catch (error) {
      console.error("Error fetching today's deadlines:", error);
    }
  };

  // Fetch all notifications (both read and unread)
  const fetchNotifications = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(db, "profiles", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const allNotifications = userSnap.data().deadlineNotifications || [];
        // Sort by createdAt (newest first)
        const sortedNotifications = allNotifications.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        setNotifications(sortedNotifications);
      }
      
      // Also fetch today's deadlines
      await fetchTodayDeadlines();
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.uid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.uid) return;

    try {
      await markNotificationAsRead(user.uid, notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationPress = (notification: DeadlineNotification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate to opportunity
    router.push({
      pathname: "../opportunity",
      params: {
        id: notification.opportunityId,
        specificCollection: notification.specificCollection || "scholarships",
      },
    });
  };

  const deleteReadNotifications = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, "profiles", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const allNotifications = userSnap.data().deadlineNotifications || [];
        // Keep only unread notifications
        const unreadNotifications = allNotifications.filter((notif: any) => !notif.read);
        
        await updateDoc(userRef, {
          deadlineNotifications: unreadNotifications,
        });
        
        setNotifications(unreadNotifications);
        console.log("✓ Read notifications deleted");
      }
    } catch (error) {
      console.error("Error deleting read notifications:", error);
    }
  };

  // Group notifications by opportunityId
  const groupedNotifications = notifications.reduce((groups: Record<string, DeadlineNotification[]>, notif) => {
    const key = notif.opportunityId;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notif);
    return groups;
  }, {});

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const hasAnyNotifications = notifications.length > 0 || todayDeadlines.length > 0;
  const hasReadNotifications = notifications.some(notif => notif.read);
  const groupedNotificationsList = Object.entries(groupedNotifications);

  return (
    <LinearGradient
      colors={["#fff", "#e6e6fa"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-5 pt-6" edges={["top"]}>
        {/* Back Arrow */}
        <TouchableOpacity
          className="mb-5"
          onPress={() => router.back()}
          hitSlop={24}
        >
          <Feather name="arrow-left" size={22} color="#18181B" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-[22px] font-karla-bold text-[#18181B] mt-2 mb-6">
          Notifications
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4B1EB4" />
            <Text className="text-[#6B7280] font-karla mt-3">Loading...</Text>
          </View>
        ) : !hasAnyNotifications ? (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            <Text className="text-[18px] font-karla-bold text-[#6B7280] mt-4 text-center">
              No Notifications
            </Text>
            <Text className="text-[14px] font-karla text-[#9CA3AF] text-center mt-2">
              You'll see deadline reminders and updates here
            </Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4B1EB4" />
            }
          >
            {/* TODAY'S REMINDERS SECTION */}
            {todayDeadlines.length > 0 && (
              <>
                <Text className="text-[16px] font-karla-bold text-[#4B1EB4] mb-3">
                  📅 Today's Deadlines
                </Text>
                {todayDeadlines.map((deadline, idx) => (
                  <React.Fragment key={`today-${deadline.opportunityId}-${idx}`}>
                    <TouchableOpacity
                      onPress={() => router.push({
                        pathname: "../opportunity",
                        params: {
                          id: deadline.opportunityId,
                          specificCollection: deadline.specificCollection,
                        },
                      })}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-start mb-6">
                        <View className="w-12 h-12 rounded-full bg-[#EF4444] items-center justify-center mr-3">
                          <Feather name="alert-circle" size={26} color="#fff" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-karla text-[#18181B] mb-1">
                            <Text className="font-karla-bold">Reminder:</Text> {deadline.milestoneDescription} for{" "}
                            <Text className="font-karla-bold">{deadline.title}</Text> is today
                          </Text>
                          <Text className="text-[13px] font-karla text-[#6B7280]">
                            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {idx < todayDeadlines.length - 1 && (
                      <View className="border-t border-[#e0e0e0] mb-4" />
                    )}
                  </React.Fragment>
                ))}
                
                {notifications.length > 0 && (
                  <View className="border-t border-[#e0e0e0] my-6" />
                )}
              </>
            )}

            {/* DEADLINE CHANGES SECTION */}
            {notifications.length > 0 && (
              <>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-[16px] font-karla-bold text-[#4B1EB4]">
                    🔔 Deadline Changes
                  </Text>
                  {hasReadNotifications && (
                    <TouchableOpacity
                      onPress={deleteReadNotifications}
                      className="px-3 py-1 bg-red-100 rounded-md"
                      activeOpacity={0.7}
                    >
                      <Text className="text-[11px] font-karla-bold text-red-600">
                        Clear Read
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {groupedNotificationsList.map(([opportunityId, groupNotifs], groupIdx) => {
                  const latestNotif = groupNotifs[0];
                  const hasUnread = groupNotifs.some(n => !n.read);
                  const isExpanded = expandedGroups[opportunityId];
                  const showGroup = groupNotifs.length > 1;

                  return (
                    <React.Fragment key={opportunityId}>
                      {/* Main Notification */}
                      <View className="mb-6">
                        <TouchableOpacity
                          onPress={() => handleNotificationPress(latestNotif)}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-start">
                            <View className={`w-12 h-12 rounded-full ${latestNotif.read ? 'bg-gray-400' : 'bg-[#F59E0B]'} items-center justify-center mr-3`}>
                              <Feather name="calendar" size={26} color="#fff" />
                            </View>
                            <View className="flex-1">
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1">
                                  <Text className="text-[15px] font-karla text-[#18181B] mb-1">
                                    <Text className="font-karla-bold">{latestNotif.opportunityTitle}</Text> deadlines updated
                                  </Text>
                                  <Text className="text-[13px] font-karla text-[#6B7280]">
                                    {formatDate(latestNotif.createdAt)}
                                  </Text>
                                  {hasUnread && (
                                    <View className="bg-[#4B1EB4] self-start px-2 py-0.5 rounded-md mt-1">
                                      <Text className="text-[11px] font-karla-bold text-white">NEW</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Expand/Collapse Toggle for Groups */}
                        {showGroup && (
                          <TouchableOpacity
                            onPress={() => toggleGroup(opportunityId)}
                            className="flex-row items-center ml-12 mt-2"
                            activeOpacity={0.7}
                          >
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={18} 
                              color="#6B7280" 
                            />
                            <Text className="text-[12px] font-karla text-[#6B7280] ml-1">
                              {isExpanded ? 'Hide' : 'Show'} {groupNotifs.length - 1} older update{groupNotifs.length - 1 !== 1 ? 's' : ''}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Expanded Notifications */}
                      {showGroup && isExpanded && (
                        <View className="ml-12 mb-4">
                          {groupNotifs.slice(1).map((notif) => (
                            <TouchableOpacity
                              key={notif.id}
                              onPress={() => handleNotificationPress(notif)}
                              activeOpacity={0.7}
                              className="mb-3"
                            >
                              <View className={`flex-row items-center p-3 rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                                <View className="flex-1">
                                  <Text className="text-[13px] font-karla text-[#18181B] mb-1">
                                    Update from {formatDate(notif.createdAt)}
                                  </Text>
                                  {!notif.read && (
                                    <View className="bg-[#4B1EB4] self-start px-1.5 py-0.5 rounded">
                                      <Text className="text-[10px] font-karla-bold text-white">NEW</Text>
                                    </View>
                                  )}
                                </View>
                                <Feather name="chevron-right" size={16} color="#6B7280" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {groupIdx < groupedNotificationsList.length - 1 && (
                        <View className="border-t border-[#e0e0e0] mb-4" />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
            
            <View className="border-t border-[#e0e0e0] my-2" />
            <Text className="text-center text-[14px] font-karla text-[#6B7280] mt-4 mb-8">
              End of Notifications
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
