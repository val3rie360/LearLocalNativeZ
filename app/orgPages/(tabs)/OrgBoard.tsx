import {
  getCommunityPosts,
  getLargestPosts,
} from "@/services/firestoreService";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
};

export default function OrgBoard() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<"top" | "default">(
    "default"
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    const data = await getCommunityPosts();
    setPosts(data);
    setSelectedSort("default");
  }, []);

  const fetchTopVotedPosts = useCallback(async () => {
    const data = await getLargestPosts();
    setPosts(data);
    setShowSortModal(false);
    setSelectedSort("top");
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Tag color logic (same as CommunityPage)
  const categories = [
    { label: "Scholarship", bg: "bg-[#BDFCFF]", text: "text-[#106074]" },
    { label: "Event", bg: "bg-[#FFC3C4]", text: "text-[#934055]" },
    { label: "Tutoring", bg: "bg-[#6C63FF]", text: "text-white" },
    { label: "Learning Materials", bg: "bg-[#F2C25B]", text: "text-[#745000]" },
    { label: "Workshop", bg: "bg-[#C6F7B2]", text: "text-[#3B7C1B]" },
  ];

  return (
    <LinearGradient colors={["#ECEAFF", "#4b1eb4c8"]} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 px-0 pt-8">
        <View className="flex-1 px-5">
          {/* Title */}
          <Text className="font-karla-bold text-[28px] text-[#18181B] mb-1.5">
            Community Board
          </Text>
          <Text className="text-black text-[15px] mb-4 font-karla leading-[20px]">
            See what students are asking for, and gain insight through upvotes
            on posts that highlight the most requested resources and programs.
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
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "#fff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 24,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              <Text className="font-karla-bold text-lg mb-4">
                Sort Posts By
              </Text>
              <TouchableOpacity
                className="py-3 border-b border-[#eee]"
                onPress={fetchTopVotedPosts}
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
                onPress={() => {
                  fetchPosts();
                  setShowSortModal(false);
                  setSelectedSort("default");
                }}
              >
                <Text
                  className={`text-base font-karla ${
                    selectedSort === "default"
                      ? "text-[#4B1EB4]"
                      : "text-[#18181B]"
                  }`}
                >
                  Default
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
                onRefresh={onRefresh}
                colors={["#4B1EB4"]}
                tintColor="#4B1EB4"
              />
            }
          >
            {posts.map((post) => {
              const category = categories.find((cat) => cat.label === post.tag);
              const tagBg = category ? category.bg : "bg-[#FFD6E0]";
              const tagText = category ? category.text : "text-[#C94F7C]";

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
                    <View className={`${tagBg} rounded-md px-2 py-0.5 mr-2`}>
                      <Text
                        className={`font-karla-bold text-[12px] ${tagText}`}
                      >
                        {post.tag}
                      </Text>
                    </View>
                    <Text className="text-black text-[13px] font-karla">
                      {post.upvotes ?? 0}{" "}
                      {post.upvotes === 1 ? "upvote" : "upvotes"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
