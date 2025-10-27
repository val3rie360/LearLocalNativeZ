import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { memo, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  Animated, Easing,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "../../../components/Common";
import OpportunityCard from "../../../components/OpportunityCard";
import { useAuth } from "../../../contexts/AuthContext";
import {
  addOpportunityBookmark,
  getAllActiveOpportunities,
  getBookmarkedOpportunities,
  getUpcomingDeadlines,
  removeOpportunityBookmark,
  getOpportunityDetails,
} from "../../../services/firestoreService";

// Import the parseFlexibleDate function (we'll need to export it from firestoreService)
// For now, let's recreate it here to match the firestore service
const parseFlexibleDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  // Already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    try {
      return dateValue.toDate();
    } catch (e) {
      return null;
    }
  }
  
  // Unix timestamp (number)
  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // String parsing
  if (typeof dateValue === 'string') {
    // Try standard Date constructor first
    let date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Handle "Nov 18, 2025" or "November 18, 2025" format
    const monthNames: { [key: string]: number } = {
      'jan': 0, 'january': 0,
      'feb': 1, 'february': 1,
      'mar': 2, 'march': 2,
      'apr': 3, 'april': 3,
      'may': 4,
      'jun': 5, 'june': 5,
      'jul': 6, 'july': 6,
      'aug': 7, 'august': 7,
      'sep': 8, 'september': 8,
      'oct': 9, 'october': 9,
      'nov': 10, 'november': 10,
      'dec': 11, 'december': 11
    };
    
    // Match "Month DD, YYYY" format
    const match = dateValue.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (match) {
      const [, monthStr, day, year] = match;
      const month = monthNames[monthStr.toLowerCase()];
      
      if (month !== undefined) {
        date = new Date(parseInt(year), month, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try ISO format "YYYY-MM-DD"
    const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
};

interface ProfileData {
  name?: string;
  email?: string;
  role?: "student" | "organization";
  createdAt?: {
    seconds: number;
  };
  verificationFileUrl?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
}

interface UpcomingDeadline {
  date: Date;
  title: string;
  milestoneDescription: string;
  opportunityId: string;
  specificCollection: string;
  category: string;
}

const CATEGORIES = [
  { icon: "apps", label: "All", bg: "#6B7280", value: "all" },
  {
    icon: "bookmark",
    label: "Saved",
    bg: "#F59E0B",
    value: "saved",
  },
  {
    icon: "school-outline",
    label: "Scholarships",
    bg: "#48DEE6",
    value: "scholarships",
  },
  {
    icon: "trophy",
    label: "Competitions",
    bg: "#5548E6",
    value: "competitions",
  },
  {
    icon: "bulb-outline",
    label: "Workshops",
    bg: "#F59E0B",
    value: "workshops",
  },
  {
    icon: "desk",
    label: "Study Spots",
    bg: "#FBBF24",
    family: "MaterialCommunityIcons",
    value: "studySpots",
  },
  // Resources redirects to Library tab instead of filtering
  {
    icon: "book-outline",
    label: "Resources",
    bg: "#F25B5E",
    value: "resources",
    isRedirect: true,
    redirectTo: "/studentPages/(tabs)/Library",
  },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "arrow-down" },
  { value: "oldest", label: "Oldest First", icon: "arrow-up" },
  { value: "deadline-soon", label: "Deadline: Soonest First", icon: "time" },
  {
    value: "deadline-far",
    label: "Deadline: Latest First",
    icon: "time-outline",
  },
];

type CategoryItemProps = {
  icon: string;
  family?: string;
  bg: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

const CategoryItem = memo(function CategoryItem({
  icon,
  family = "Ionicons",
  bg,
  label,
  isSelected,
  onPress,
}: CategoryItemProps) {
  const IconComponent =
    family === "MaterialCommunityIcons" ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity onPress={onPress} className="items-center">
      <View
        className={`w-[63px] h-[63px] rounded-lg justify-center items-center shadow-sm ${
          isSelected ? "border-2 border-[#4B1EB4]" : ""
        }`}
        style={{
          backgroundColor: bg,
          opacity: isSelected ? 1 : 0.7,
        }}
      >
        <IconComponent name={icon as any} size={25} color="#fff" />
        {isSelected && (
          <View className="absolute -top-1 -right-1 bg-[#4B1EB4] rounded-full w-5 h-5 items-center justify-center">
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>
      <Text className="mt-2.5 text-[13px] font-karla-bold text-black text-center">
        {label}
      </Text>
    </TouchableOpacity>
  );
});

export default function Home() {
  const router = useRouter();
  const { user, profileData, profileLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const scrollViewRef = useRef<ScrollView>(null);
const [showScrollTop, setShowScrollTop] = useState(false);

  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<
    UpcomingDeadline[]
  >([]);
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<any[]>(
    []
  );
  const [opportunityDeadlines, setOpportunityDeadlines] = useState<Map<string, Date>>(
    new Map()
  );

  // Get display name with fallbacks
  const getDisplayName = () => {
    if (profileLoading) return "there";
    return (
      profileData?.name ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "there"
    );
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format deadline date for upcoming deadlines section (e.g., "OCT 25")
  const formatDeadlineDate = (date: Date) => {
    return date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  };

  // Map category names to collection names (same as in firestoreService)
  const getCollectionNameForCategory = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      "Scholarship / Grant": "scholarships",
      "Competition / Event": "competitions", 
      "Workshop / Seminar": "workshops",
      Resources: "resources",
      "Study Spot": "studySpots",
    };
    return categoryMap[category] || "opportunities";
  };

  // Fetch full opportunity data and get earliest deadline
  const getEarliestDeadlineFromFullData = async (opportunity: any): Promise<Date> => {
    try {
      console.log(`🔍 getEarliestDeadlineFromFullData called for "${opportunity.title}"`);
      console.log(`  - ID: ${opportunity.id}`);
      console.log(`  - Category: ${opportunity.category}`);
      console.log(`  - Specific Collection: ${opportunity.specificCollection}`);
      
      // Determine the correct collection based on category
      const category = opportunity.category || opportunity.specificCollection;
      const targetCollection = getCollectionNameForCategory(category);
      
      console.log(`  - Target Collection: ${targetCollection}`);
      
      // If we already have dateMilestones in the preview data, use them
      if (
        opportunity.dateMilestones &&
        Array.isArray(opportunity.dateMilestones) &&
        opportunity.dateMilestones.length > 0
      ) {
        console.log(`  ✅ Using dateMilestones from preview data (${opportunity.dateMilestones.length} milestones)`);
        return getEarliestDeadline(opportunity);
      }

      // Fetch full opportunity data from the correct category collection
      if (targetCollection && opportunity.id && targetCollection !== "opportunities") {
        console.log(`  🔄 Fetching full data from ${targetCollection}...`);
        const fullData = await getOpportunityDetails(opportunity.id, targetCollection);
        
        if (fullData) {
          console.log(`  ✅ Full data fetched successfully`);
          console.log(`  - Has dateMilestones: ${!!(fullData as any).dateMilestones}`);
          console.log(`  - DateMilestones count: ${(fullData as any).dateMilestones?.length || 0}`);
          
          if ((fullData as any).dateMilestones && Array.isArray((fullData as any).dateMilestones)) {
            console.log(`  📅 Found ${(fullData as any).dateMilestones.length} milestones for "${opportunity.title}"`);
            const deadline = getEarliestDeadline(fullData);
            console.log(`  📅 Earliest deadline: ${deadline.toLocaleDateString()}`);
            return deadline;
          } else {
            console.log(`  ⚠️ No dateMilestones found in full data`);
          }
        } else {
          console.log(`  ❌ Failed to fetch full data`);
        }
      } else {
        console.log(`  ⚠️ Missing targetCollection, ID, or targetCollection is 'opportunities'`);
      }

      // Fallback to preview data
      console.log(`  🔄 Falling back to preview data`);
      return getEarliestDeadline(opportunity);
    } catch (error) {
      console.error(`❌ Error in getEarliestDeadlineFromFullData for "${opportunity.title}":`, error);
      // Fallback to preview data
      return getEarliestDeadline(opportunity);
    }
  };

  const getEarliestDeadline = (opportunity: any): Date => {
    console.log(`🔍 getEarliestDeadline called for "${opportunity.title}"`);
    console.log(`  - Has dateMilestones: ${!!opportunity.dateMilestones}`);
    console.log(`  - DateMilestones:`, opportunity.dateMilestones);
    
    // Check if we have dateMilestones
    if (opportunity.dateMilestones && Array.isArray(opportunity.dateMilestones) && opportunity.dateMilestones.length > 0) {
      console.log(`  📅 Processing ${opportunity.dateMilestones.length} dateMilestones`);
      
      // Use the proven parseFlexibleDate function
      const validMilestones = opportunity.dateMilestones
        .map((milestone: any) => {
          console.log(`    Milestone:`, milestone);
          const parsedDate = parseFlexibleDate(milestone.date);
          console.log(`    Parsed date:`, parsedDate ? parsedDate.toISOString() : 'null');
          return { milestone, parsedDate };
        })
        .filter(({ parsedDate }: { parsedDate: Date | null }) => parsedDate !== null);
      
      console.log(`  ✅ Found ${validMilestones.length} valid milestones`);
      
      if (validMilestones.length > 0) {
        // Sort by date and get the earliest
        validMilestones.sort((a: any, b: any) => a.parsedDate!.getTime() - b.parsedDate!.getTime());
        const earliestMilestone = validMilestones[0];
        console.log(`📅 Earliest deadline: ${earliestMilestone.parsedDate!.toLocaleDateString()}`);
        return earliestMilestone.parsedDate!;
      }
    }
    
    // Check for single deadline field
    if (opportunity.deadline) {
      console.log(`  📅 Processing single deadline field`);
      const deadline = parseFlexibleDate(opportunity.deadline);
      if (deadline) {
        console.log(`📅 Single deadline: ${deadline.toLocaleDateString()}`);
        return deadline;
      }
    }
    
    // Fallback
    console.log(`  🔄 Using fallback deadline`);
    const fallback = opportunity.createdAt?.toDate?.() || new Date(opportunity.createdAt);
    const fallbackDate = new Date(fallback.getTime() + 30 * 24 * 60 * 60 * 1000);
    console.log(`📅 Fallback deadline: ${fallbackDate.toLocaleDateString()}`);
    return fallbackDate;
  };

  // Filter opportunities by category (excluding resources from all categories)
  const filterOpportunities = (opps: any[]) => {
    // Always exclude resources from the feed and filter by verified organizations
    return opps.filter((op) => {
      // Check multiple possible field names and handle case-insensitivity
      const specificCollection = (
        op.specificCollection ||
        op.category ||
        ""
      ).toLowerCase();
      const isNotResource =
        specificCollection !== "resources" &&
        specificCollection !== "resource" &&
        op.type !== "resources" &&
        op.type !== "resource";

      const matchesCategory =
        selectedCategory === "all" ||
        op.specificCollection === selectedCategory ||
        specificCollection === selectedCategory.toLowerCase();

      const isVerified = isOpportunityOrganizationVerified(op);

      return isNotResource && matchesCategory && isVerified;
    });
  };

  // Sort opportunities based on selected criteria
  const sortOpportunities = (opps: any[]) => {
    const sorted = [...opps];

    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });

      case "deadline-soon":
        return sorted.sort((a, b) => {
          const deadlineA = getEarliestDeadline(a);
          const deadlineB = getEarliestDeadline(b);
          return deadlineA.getTime() - deadlineB.getTime();
        });

      case "deadline-far":
        return sorted.sort((a, b) => {
          const deadlineA = getEarliestDeadline(a);
          const deadlineB = getEarliestDeadline(b);
          return deadlineB.getTime() - deadlineA.getTime();
        });

      default:
        return sorted;
    }
  };

  // Get filtered and sorted opportunities
  const getDisplayedOpportunities = () => {
    // If "Saved" category is selected, show bookmarked opportunities
    if (selectedCategory === "saved") {
      console.log(
        `📋 Displaying ${bookmarkedOpportunities.length} saved opportunities`
      );
      if (bookmarkedOpportunities.length > 0) {
        console.log("📋 Saved opportunities:", bookmarkedOpportunities.map(op => ({
          id: op.id,
          title: op.title,
          organizationName: getOpportunityOrganizationName(op),
          specificCollection: op.specificCollection
        })));
      }
      return sortOpportunities(bookmarkedOpportunities);
    }

    const filtered = filterOpportunities(opportunities);
    return sortOpportunities(filtered);
  };

  // Fetch upcoming deadlines for registered opportunities
  const fetchUpcomingDeadlines = async () => {
    if (!user?.uid) return;

    try {
      const deadlines = await getUpcomingDeadlines(user.uid, 50); // Get more, we'll filter to top 3

      // Sort by most urgent (earliest date first) and take top 3
      const sortedDeadlines = deadlines
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3);

      setUpcomingDeadlines(sortedDeadlines);
      console.log(`📅 Fetched ${sortedDeadlines.length} upcoming deadlines`);
    } catch (error) {
      console.error("Error fetching upcoming deadlines:", error);
      setUpcomingDeadlines([]);
    }
  };

  // Fetch bookmarked opportunities
  const fetchBookmarkedOpportunities = async () => {
    if (!user?.uid) {
      console.log("⚠️ No user ID, skipping bookmark fetch");
      return;
    }

    try {
      console.log("🔄 Fetching bookmarked opportunities...");
      const bookmarked = await getBookmarkedOpportunities(user.uid);
      setBookmarkedOpportunities(bookmarked);
      console.log(
        `🔖 Set ${bookmarked.length} bookmarked opportunities in state`
      );
      if (bookmarked.length > 0) {
        console.log(
          "  Bookmarked opportunity IDs:",
          bookmarked.map((b) => b.id)
        );
        console.log(
          "  Bookmarked opportunity titles:",
          bookmarked.map((b) => b.title)
        );
      }
    } catch (error) {
      console.error("Error fetching bookmarked opportunities:", error);
      setBookmarkedOpportunities([]);
    }
  };

  // Fetch opportunities
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const data = await getAllActiveOpportunities();

      // Log resource filtering for debugging
      const resourceOpps = data.filter((op: any) => {
        const specificCollection = (
          op.specificCollection ||
          op.category ||
          ""
        ).toLowerCase();
        return (
          specificCollection === "resources" ||
          specificCollection === "resource" ||
          op.type === "resources" ||
          op.type === "resource"
        );
      });

      if (resourceOpps.length > 0) {
        console.log(
          `🔍 Filtered out ${resourceOpps.length} resource opportunities from feed`
        );
      }

      setOpportunities(data);
      
      // Fetch deadlines for all opportunities
      fetchOpportunityDeadlines(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      setOpportunities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch deadlines for all opportunities
  const fetchOpportunityDeadlines = async (opps: any[]) => {
    console.log(`🔄 Starting to fetch deadlines for ${opps.length} opportunities`);
    const deadlineMap = new Map<string, Date>();
    
    // Process opportunities in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < opps.length; i += batchSize) {
      const batch = opps.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} opportunities`);
      
      const deadlinePromises = batch.map(async (op) => {
        try {
          console.log(`🔍 Fetching deadline for "${op.title}" (${op.id}) from ${op.specificCollection}`);
          const deadline = await getEarliestDeadlineFromFullData(op);
          console.log(`✅ Got deadline for "${op.title}": ${deadline.toLocaleDateString()}`);
          return { id: op.id, deadline };
        } catch (error) {
          console.error(`❌ Error fetching deadline for ${op.id}:`, error);
          const fallbackDeadline = getEarliestDeadline(op);
          console.log(`🔄 Using fallback deadline for "${op.title}": ${fallbackDeadline.toLocaleDateString()}`);
          return { id: op.id, deadline: fallbackDeadline };
        }
      });
      
      const results = await Promise.all(deadlinePromises);
      results.forEach(({ id, deadline }) => {
        deadlineMap.set(id, deadline);
      });
    }
    
    console.log(`✅ Completed fetching deadlines for ${deadlineMap.size} opportunities`);
    setOpportunityDeadlines(deadlineMap);
  };

  useEffect(() => {
    fetchOpportunities();
    fetchUpcomingDeadlines();
    fetchBookmarkedOpportunities();
  }, [user?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
    fetchUpcomingDeadlines();
    fetchBookmarkedOpportunities();
  };

  // Get organization name from opportunity
  const getOpportunityOrganizationName = (op: any): string =>
    op?.organizationProfile?.name ??
    op?.organizationName ??
    op?.organization?.name ??
    "Organization";

  const isOpportunityOrganizationVerified = (op: any): boolean =>
    (op?.organizationProfile?.verificationStatus ??
      op?.organizationVerificationStatus ??
      op?.organization?.verificationStatus) === "verified";

  // Check if an opportunity is bookmarked
  const isOpportunityBookmarked = (
    opportunityId: string,
    specificCollection: string
  ): boolean => {
    return bookmarkedOpportunities.some(
      (bookmark) =>
        bookmark.id === opportunityId &&
        bookmark.specificCollection === specificCollection
    );
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (
    opportunityId: string,
    specificCollection: string
  ) => {
    if (!user?.uid) {
      console.log("⚠️ No user ID, cannot toggle bookmark");
      return;
    }

    try {
      const isCurrentlyBookmarked = isOpportunityBookmarked(
        opportunityId,
        specificCollection
      );
      console.log(
        `🔄 Toggling bookmark for ${opportunityId} (currently bookmarked: ${isCurrentlyBookmarked})`
      );

      if (isCurrentlyBookmarked) {
        console.log(`  Removing bookmark...`);
        await removeOpportunityBookmark(
          user.uid,
          opportunityId,
          specificCollection
        );
      } else {
        console.log(`  Adding bookmark...`);
        await addOpportunityBookmark(
          user.uid,
          opportunityId,
          specificCollection
        );
      }

      // Refresh bookmarked opportunities
      console.log(`  Refreshing bookmarked opportunities list...`);
      await fetchBookmarkedOpportunities();
      
      // If we're currently viewing saved opportunities, refresh the display
      if (selectedCategory === "saved") {
        console.log(`  Refreshing saved view...`);
        // Force a re-render by updating state
        setBookmarkedOpportunities(prev => [...prev]);
      }
    } catch (error) {
      console.error("❌ Error toggling bookmark:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4B1EB4]" edges={["top"]}>
      <ScrollView
      ref={scrollViewRef}
        className="bg-[#E0E3FF] flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={(event) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setShowScrollTop(yOffset > 400); // show after scrolling 400px
  }}
  scrollEventThrottle={16}
      >
        {/* Header */}
        <View className="bg-[#4B1EB4] rounded-b-2xl pb-[100px] px-5">
          <View className=" pt-5 flex-row justify-between items-center">
            <View>
              <Text className="text-[26px] text-white font-karla">
                Hi, <Text className="font-karla-bold">{getDisplayName()}!</Text>
              </Text>
              <Text className="text-[14px] mb-4 text-[#EAEAEA] font-karla">
                Discover what's new today.
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("../notifications")}>
              <Ionicons
                name="notifications-circle-outline"
                size={43}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          <SearchBar />
        </View>
        {/* Upcoming Deadlines */}
        <View className="mt-[-90px] px-5">
          <View
            className="bg-white p-4 rounded-2xl shadow-sm"
            style={{ elevation: 4 }}
          >
            <Text className="text-[20px] font-karla-bold mb-3">
              Upcoming Deadlines
            </Text>
            {upcomingDeadlines.length > 0 ? (
              <>
                {upcomingDeadlines.map((item, idx) => (
                  <View key={`${item.opportunityId}-${idx}`}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "../opportunity",
                          params: {
                            id: item.opportunityId,
                            specificCollection: item.specificCollection,
                          },
                        })
                      }
                    >
                      <Text className="text-[#4B1EB4] font-karla text-[15px] mb-0.5">
                        <Text className="font-karla-bold">
                          {formatDeadlineDate(item.date)}
                        </Text>
                        : {item.milestoneDescription} - {item.title}
                      </Text>
                    </TouchableOpacity>
                    {idx < upcomingDeadlines.length - 1 && (
                      <View className="h-0.5 bg-[#E5E5E5] my-1" />
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => router.push("/studentPages/(tabs)/Calendar")}
                >
                  <Text className="text-[#605E8F] mt-2 text-right font-karla-bold">
                    See all
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View className="py-4 items-center">
                <Ionicons name="calendar-outline" size={40} color="#CCC" />
                <Text className="text-[#999] font-karla text-center mt-2 text-[14px]">
                  No upcoming deadlines
                </Text>
                <Text className="text-[#BBB] font-karla text-center text-[13px]">
                  Register for opportunities to track their deadlines
                </Text>
              </View>
            )}
            {/* Fade effect */}
            {upcomingDeadlines.length > 0 && (
              <LinearGradient
                colors={["transparent", "#fff"]}
                style={{
                  position: "absolute",
                  bottom: 40,
                  left: 0,
                  right: 0,
                  height: 60,
                }}
                pointerEvents="none"
              />
            )}
          </View>
        </View>
        {/* Categories */}
        <View className="my-5">
          <Text className="text-[16px] font-karla-bold mb-3 px-5 text-[#333]">
            Filter by Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
          >
            {CATEGORIES.map((c) => (
              <CategoryItem
                key={c.value}
                {...c}
                isSelected={selectedCategory === c.value}
                onPress={() => {
                  if (c.isRedirect && c.redirectTo) {
                    console.log(`Redirecting to: ${c.redirectTo}`);
                    try {
                      router.push(c.redirectTo as any);
                    } catch (error) {
                      console.error("Navigation error:", error);
                    }
                  } else {
                    setSelectedCategory(c.value);
                    // If switching to saved category, refresh bookmarked opportunities
                    if (c.value === "saved") {
                      console.log("🔄 Switching to saved category, refreshing bookmarks...");
                      fetchBookmarkedOpportunities();
                    }
                  }
                }}
              />
            ))}
          </ScrollView>
        </View>
        {/* Opportunities */}
        <LinearGradient
          colors={["#fff", "#DADEFF"]}
          style={{ padding: 25, marginTop: 20 }}
        >
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-[20px] font-karla-bold">Opportunities</Text>
              {!loading && (
                <Text className="text-[13px] text-[#666] font-karla mt-0.5">
                  {getDisplayedOpportunities().length}{" "}
                  {getDisplayedOpportunities().length === 1
                    ? "result"
                    : "results"}
                  {selectedCategory !== "all" &&
                    ` in ${CATEGORIES.find((c) => c.value === selectedCategory)?.label}`}
                </Text>
              )}
            </View>

            {/* Sort Button */}
            <TouchableOpacity
              onPress={() => setShowSortModal(true)}
              className="flex-row items-center bg-white px-3 py-2 rounded-lg shadow-sm"
              style={{ elevation: 2 }}
            >
              <Ionicons name="funnel" size={16} color="#4B1EB4" />
              <Text className="ml-1.5 text-[#4B1EB4] font-karla-bold text-[13px]">
                {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label.split(
                  ":"
                )[0] || "Sort"}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#4B1EB4" />
              <Text className="text-[#666] mt-2 font-karla">
                Loading opportunities...
              </Text>
            </View>
          ) : getDisplayedOpportunities().length > 0 ? (
            getDisplayedOpportunities().map((op) => (
              <OpportunityCard
                key={op.id}
                title={op.title}
                postedBy={getOpportunityOrganizationName(op)}
                posterVerified={isOpportunityOrganizationVerified(op)}
                deadline={op.category === "Study Spot" ? undefined : formatDate(opportunityDeadlines.get(op.id) || getEarliestDeadline(op))}
                amount={op.category === "Study Spot" ? undefined : (op.amount || "N/A")}
                description={op.description}
                tag={op.category}
                bookmarked={isOpportunityBookmarked(
                  op.id,
                  op.specificCollection
                )}
                onBookmarkToggle={() =>
                  handleBookmarkToggle(op.id, op.specificCollection)
                }
                onViewDetails={() =>
                  router.push({
                    pathname: "../opportunity",
                    params: {
                      id: op.id,
                      specificCollection: op.specificCollection,
                    },
                  })
                }
              />
            ))
          ) : (
            <View className="py-8 items-center px-8">
              <Ionicons
                name={
                  selectedCategory === "saved"
                    ? "bookmark-outline"
                    : "search-outline"
                }
                size={48}
                color="#CCC"
              />
              <Text className="text-[#666] font-karla-bold text-[16px] mt-3">
                {selectedCategory === "saved"
                  ? "No saved opportunities"
                  : "No opportunities found"}
              </Text>
              <Text className="text-[#999] font-karla text-center mt-1">
                {selectedCategory === "saved"
                  ? "Bookmark opportunities to save them for later"
                  : selectedCategory !== "all"
                    ? `No ${CATEGORIES.find((c) => c.value === selectedCategory)?.label.toLowerCase()} available right now`
                    : "Check back later for new opportunities"}
              </Text>
              {selectedCategory !== "all" && selectedCategory !== "saved" && (
                <TouchableOpacity
                  onPress={() => setSelectedCategory("all")}
                  className="mt-4 px-4 py-2 bg-[#4B1EB4] rounded-lg"
                >
                  <Text className="text-white font-karla-bold">View All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </LinearGradient>
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
          className="flex-1 bg-black/50 justify-center items-center"
        >
          <View
            className="bg-white rounded-2xl w-[85%] shadow-lg"
            style={{ elevation: 10 }}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View className="border-b border-gray-200 p-4">
              <Text className="text-[18px] font-karla-bold text-center">
                Sort Opportunities
              </Text>
            </View>

            {/* Sort Options */}
            <View className="py-2">
              {SORT_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false);
                  }}
                  className={`flex-row items-center px-4 py-3.5 ${
                    index < SORT_OPTIONS.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      sortBy === option.value ? "#F6F4FE" : "transparent",
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor:
                        sortBy === option.value ? "#4B1EB4" : "#E0E3FF",
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={sortBy === option.value ? "#fff" : "#4B1EB4"}
                    />
                  </View>

                  <Text
                    className="flex-1 font-karla text-[15px]"
                    style={{
                      fontFamily:
                        sortBy === option.value
                          ? "Karla-Bold"
                          : "Karla-Regular",
                      color: sortBy === option.value ? "#4B1EB4" : "#333",
                    }}
                  >
                    {option.label}
                  </Text>

                  {sortBy === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#4B1EB4"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel Button */}
            <View className="border-t border-gray-200 p-3">
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                className="py-2.5 items-center"
              >
                <Text className="text-[#666] font-karla-bold text-[15px]">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {showScrollTop && (
  <TouchableOpacity
    onPress={() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }}
    className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[#4B1EB4] items-center justify-center shadow-lg"
    style={{ elevation: 8 }}
  >
    <Ionicons name="arrow-up" size={26} color="#fff" />
  </TouchableOpacity>
)}
    </SafeAreaView>
  );
}
