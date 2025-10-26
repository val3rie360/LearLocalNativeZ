import { useAuth } from "@/contexts/AuthContext";
import {
  getCommunityPosts,
  getLargestPosts,
  updateCommunityPostUpvotes,
} from "@/services/firestoreService";
import { Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CommunityPost = {
  id: string;
  user: string;
  date: string;
  title: string;
  desc: string;
  tag: string;
  tagColor?: string;
  tagTextColor?: string;
  upvotes?: number;
  upvotedBy?: string[];
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Scholarship: { bg: "bg-[#BDFCFF]", text: "text-[#106074]" },
  Event: { bg: "bg-[#FFC3C4]", text: "text-[#934055]" },
  Tutoring: { bg: "bg-[#6C63FF]", text: "text-white" },
  "Learning Materials": { bg: "bg-[#F2C25B]", text: "text-[#745000]" },
  Workshop: { bg: "bg-[#C6F7B2]", text: "text-[#3B7C1B]" },
};

const DEFAULT_CATEGORY_STYLE = { bg: "bg-[#FFD6E0]", text: "text-[#C94F7C]" };

const getPostTimestamp = (post: CommunityPost & { createdAt?: any }) => {
  const createdAt = (post as any)?.createdAt;
  if (createdAt?.toMillis) return createdAt.toMillis();
  if (typeof createdAt === "number") return createdAt;
  if (typeof createdAt?.seconds === "number") return createdAt.seconds * 1000;
  const parsedDate = Date.parse(post.date);
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

const sortPostsByNewest = (list: CommunityPost[]) =>
  [...list].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

const buildUpvoteMap = (list: CommunityPost[], userId: string) =>
  list.reduce<Record<string, boolean>>((acc, post) => {
    acc[post.id] = Array.isArray(post.upvotedBy)
      ? post.upvotedBy.includes(userId)
      : false;
    return acc;
  }, {});

const applyUpvoteToPosts = (
  list: CommunityPost[],
  postId: string,
  willUpvote: boolean,
  userId: string
) =>
  list.map((post) => {
    if (post.id !== postId) return post;

    const baseUpvotes = post.upvotes ?? 0;
    const baseUpvotedBy = Array.isArray(post.upvotedBy) ? post.upvotedBy : [];
    const wasUpvoted = baseUpvotedBy.includes(userId);

    if (wasUpvoted === willUpvote) return post;

    const nextUpvotes = Math.max(0, baseUpvotes + (willUpvote ? 1 : -1));
    const nextUpvotedBy = willUpvote
      ? [...baseUpvotedBy, userId]
      : baseUpvotedBy.filter((id) => id !== userId);

    return { ...post, upvotes: nextUpvotes, upvotedBy: nextUpvotedBy };
  });

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [upvoted, setUpvoted] = useState<{ [postId: string]: boolean }>({});
  const [upvoteProcessing, setUpvoteProcessing] = useState<
    Record<string, boolean>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<"top" | "default">(
    "default"
  );

  const upvoteStorageKey = `community_upvoted_${userId}`;

  const loadPosts = useCallback(
    async (
      mode: "default" | "top",
      options: { showRefreshing?: boolean; closeSortModal?: boolean } = {}
    ) => {
      const { showRefreshing = false, closeSortModal = false } = options;
      if (showRefreshing) setRefreshing(true);

      try {
        const data =
          mode === "top" ? await getLargestPosts() : await getCommunityPosts();
        const normalized = mode === "default" ? sortPostsByNewest(data) : data;

        setPosts(normalized);
        setUpvoted(buildUpvoteMap(normalized, userId));
        setSelectedSort(mode);
      } catch (error) {
        console.error("Error loading community posts:", error);
      } finally {
        if (showRefreshing) setRefreshing(false);
        if (closeSortModal) setShowSortModal(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(upvoteStorageKey);
        if (stored) setUpvoted(JSON.parse(stored));
      } catch {}
      await loadPosts("default");
    })();
  }, [loadPosts, upvoteStorageKey]);

  useEffect(() => {
    AsyncStorage.setItem(upvoteStorageKey, JSON.stringify(upvoted)).catch(
      () => {}
    );
  }, [upvoted, upvoteStorageKey]);

  const handleUpvote = async (postId: string) => {
    if (!userId || userId === "guest") return;
    if (upvoteProcessing[postId]) return;

    const currentlyUpvoted = !!upvoted[postId];
    const willUpvote = !currentlyUpvoted;

    setUpvoteProcessing((prev) => ({ ...prev, [postId]: true }));
    setUpvoted((prev) => ({ ...prev, [postId]: willUpvote }));
    setPosts((prev) => applyUpvoteToPosts(prev, postId, willUpvote, userId));

    try {
      await updateCommunityPostUpvotes(postId, userId);
      await loadPosts(selectedSort);
    } catch (error) {
      console.error("Error updating upvote:", error);
      setUpvoted((prev) => ({ ...prev, [postId]: currentlyUpvoted }));
      setPosts((prev) =>
        applyUpvoteToPosts(prev, postId, currentlyUpvoted, userId)
      );
    } finally {
      setUpvoteProcessing((prev) => {
        const { [postId]: _ignore, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4FE]">
      <View className="flex-1 px-5">
        {/* Back Arrow */}
        <TouchableOpacity
          className="mt-5 mb-2 w-8"
          hitSlop={10}
          onPress={() => router.replace("/studentPages/(tabs)/Profile")}
        >
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="font-karla-bold text-[28px] text-[#18181B] mb-1.5">
          Community Board
        </Text>
        <Text className="text-[#6B7280] text-[15px] mb-4 font-karla leading-[20px]">
          A student-driven space to share ideas, requests, and feedback on
          learning materials and opportunities. Upvote posts so organizers can
          see what you truly need.
        </Text>

        {/* Divider */}
        <View className="h-[1px] bg-[#E5E0FF] my-2" />

        {/* Posts Feed Header */}
        <View className="flex-row items-center mb-5">
          <Text className="font-karla-bold text-[17px] text-[#18181B] flex-1">
            Posts Feed
          </Text>
          <TouchableOpacity onPress={() => setShowSortModal(true)}>
            <Ionicons name="options-outline" size={20} color="#4B1EB4" />
          </TouchableOpacity>
        </View>

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSortModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }} />
          </TouchableWithoutFeedback>
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[20px] p-6 shadow-lg">
            <Text className="font-karla-bold text-lg mb-4">Sort Posts By</Text>
            <TouchableOpacity
              className="py-3 border-b border-[#eee]"
              onPress={() => loadPosts("top", { closeSortModal: true })}
            >
              <Text
                className={`text-base font-karla ${
                  selectedSort === "top" ? "text-[#4B1EB4]" : "text-[#18181B]"
                }`}
              >
                Top Votes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-3"
              onPress={() => loadPosts("default", { closeSortModal: true })}
            >
              <Text
                className={`text-base font-karla ${
                  selectedSort === "default"
                    ? "text-[#4B1EB4]"
                    : "text-[#18181B]"
                }`}
              >
                Default (Newest)
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Posts */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                loadPosts(selectedSort, { showRefreshing: true })
              }
            />
          }
        >
          {posts.length === 0 ? (
            <View className="items-center mt-10">
              <Text className="text-[#A1A1AA] text-base font-karla">
                No posts yet. Be the first to create one!
              </Text>
            </View>
          ) : (
            posts.map((post) => {
              const category =
                CATEGORY_STYLES[post.tag] ?? DEFAULT_CATEGORY_STYLE;

              return (
                <View
                  key={post.id}
                  className="bg-white rounded-2xl px-4 py-4 mb-4 shadow-sm"
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center mb-0.5">
                    <FontAwesome
                      name="user-circle-o"
                      size={18}
                      color="#4B1EB4"
                    />
                    <Text className="ml-1.5 font-karla-bold text-[#18181B] text-[13px]">
                      {post.user}
                    </Text>
                    <Text className="ml-1.5 text-[#A1A1AA] text-[12px] font-karla">
                      posted {post.date}
                    </Text>
                  </View>
                  <Text className="font-karla-bold text-[15px] text-[#18181B] mt-0.5">
                    {post.title}
                  </Text>
                  <Text className="text-[#52525B] text-[13px] mt-0.5 mb-2 font-karla">
                    {post.desc}
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className={`${category.bg} rounded-md px-2 py-0.5 mr-2`}
                    >
                      <Text
                        className={`font-karla-bold text-[12px] ${category.text}`}
                      >
                        {post.tag}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUpvote(post.id)}
                      activeOpacity={0.7}
                      disabled={!userId || userId === "guest"}
                    >
                      <Entypo
                        name="arrow-bold-up"
                        size={16}
                        color={upvoted[post.id] ? "#4B1EB4" : "#A1A1AA"}
                        style={{ marginRight: 3 }}
                      />
                    </TouchableOpacity>
                    <Text className="text-[#A1A1AA] text-[13px] font-karla">
                      {post.upvotes ?? 0}{" "}
                      {post.upvotes === 1 ? "upvote" : "upvotes"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Create Post Button */}
        <TouchableOpacity
          className="bg-secondary rounded-full py-3 items-center mb-4 mt-1.5"
          onPress={() => router.push("./createpost")}
        >
          <Text className="text-white font-karla-bold text-[16px]">
            Create Post
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
