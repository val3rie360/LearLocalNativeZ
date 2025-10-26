import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type OpportunityCardProps = {
  title: string;
  postedBy: string;
  deadline: string;
  amount: string;

  description: string;
  tag: string;
  onViewDetails?: () => void;
  bookmarked?: boolean;
  posterVerified?: boolean;
  onBookmarkToggle?: () => void;
};

const InfoRow = ({
  icon,
  label,
  value,
  valueSuffix,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueSuffix?: React.ReactNode;
}) => (
  <View className="flex-row items-center mb-1 flex-nowrap">
    <Ionicons
      name={icon}
      size={16}
      color="#4B1EB4"
      style={{ marginRight: 6 }}
    />
    <Text className="text-[14px] text-[#4B1EB4] font-karla-bold mr-1.5">
      {label}
    </Text>
    <Text
      className="text-[14px] text-[#222] font-karla flex-shrink"
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {value}
    </Text>
    {valueSuffix}
  </View>
);

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  postedBy,
  deadline,
  amount,
  description,
  tag,
  onViewDetails,
  bookmarked = false,
  posterVerified = false,
  onBookmarkToggle,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);

  // Sync internal state with prop changes
  useEffect(() => {
    setIsBookmarked(bookmarked);
  }, [bookmarked]);

  const handleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    // Call parent callback to persist bookmark state
    if (onBookmarkToggle) {
      onBookmarkToggle();
    }
  };

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-5 relative shadow-2xl shadow-[#4B1EB4]/40 border border-gray-200"
      style={{ elevation: 1 }}
    >
      {/* Title and Bookmark Row */}
      <View className="flex-row items-start justify-between mb-2">
        <Text
          className="text-[18px] text-[#4B1EB4] font-karla-bold pr-4 flex-1"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <FontAwesome
          name={isBookmarked ? "bookmark" : "bookmark-o"}
          size={27}
          color={isBookmarked ? "#4B1EB4" : "#BFC1D1"}
          onPress={handleBookmark}
        />
      </View>
      {/* Info */}
      <InfoRow icon="person-outline" label="Posted by:" value={postedBy} />
      <InfoRow icon="calendar-outline" label="Deadline:" value={deadline} />
      <InfoRow icon="cash-outline" label="Amount:" value={amount} />

      {/* Description */}
      <Text
        className="text-[#666] text-[13px] my-2 font-karla"
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {description}
      </Text>
      {/* Footer */}
      <View className="flex-row items-center justify-between mt-2.5">
        <View className="bg-[#BDFCFF] py-1.5 px-3.5 rounded-full">
          <Text className="text-[14px] text-[#0B617C] font-karla-bold">
            {tag}
          </Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center bg-[#4B1EB4] rounded-full py-2 px-4"
          onPress={onViewDetails}
        >
          <Text className="text-white font-karla-bold text-[14px] mr-1.5">
            View
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
export default OpportunityCard;
