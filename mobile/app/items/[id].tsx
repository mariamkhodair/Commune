import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import ProposeSwapModal from "@/components/ProposeSwapModal";

const { width } = Dimensions.get("window");

type ItemDetail = {
  id: string; name: string; description: string; category: string;
  condition: string; points: number; photos: string[]; status: string;
  ownerId: string; ownerName: string;
};

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useUser();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [proposing, setProposing] = useState(false);

  useEffect(() => {
    if (!id || !userId) return;
    fetchItem();
  }, [id, userId]);

  async function fetchItem() {
    const [{ data: itemData }, { data: likeData }] = await Promise.all([
      supabase.from("items").select("*, profiles(id, name)").eq("id", id).single(),
      supabase.from("item_likes").select("id").eq("item_id", id).eq("user_id", userId!).maybeSingle(),
    ]);
    if (itemData) {
      const p = Array.isArray(itemData.profiles) ? itemData.profiles[0] : itemData.profiles;
      setItem({
        id: itemData.id, name: itemData.name, description: itemData.description ?? "",
        category: itemData.category, condition: itemData.condition, points: itemData.points,
        photos: itemData.photos ?? [], status: itemData.status,
        ownerId: itemData.owner_id, ownerName: p?.name ?? "Unknown",
      });
    }
    setLiked(!!likeData);
    setLoading(false);
  }

  async function toggleLike() {
    if (!item) return;
    setLiked((l) => !l);
    if (liked) {
      await supabase.from("item_likes").delete().eq("item_id", item.id).eq("user_id", userId!);
    } else {
      await supabase.from("item_likes").insert({ item_id: item.id, user_id: userId! });
    }
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F2", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#4A3728" />
    </View>
  );

  if (!item) return (
    <View style={{ flex: 1, backgroundColor: "#FAF7F2", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#8B7355" }}>Item not found.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={{ width, height: width }} className="bg-[#EDE8DF]">
          {item.photos[photoIndex] ? (
            <Image source={{ uri: item.photos[photoIndex] }} style={{ width, height: width }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="image-outline" size={48} color="#C4B9AA" />
            </View>
          )}
          {/* Back + like buttons */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          {item.ownerId !== userId && (
            <TouchableOpacity
              onPress={toggleLike}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 items-center justify-center"
            >
              <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color="#A0624A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail strip */}
        {item.photos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 py-2 gap-2">
            {item.photos.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => setPhotoIndex(i)}>
                <Image
                  source={{ uri: p }}
                  style={{ width: 52, height: 52, borderRadius: 8, borderWidth: photoIndex === i ? 2 : 0, borderColor: "#4A3728" }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Details */}
        <View className="px-5 pt-4 pb-8">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-xl font-semibold text-[#4A3728] flex-1 mr-3">{item.name}</Text>
            <Text className="text-xl font-bold text-[#4A3728]">{item.points} pts</Text>
          </View>
          <Text className="text-sm text-[#8B7355] mb-4">{item.category} · {item.condition}</Text>

          {item.description ? (
            <Text className="text-sm text-[#6B5040] mb-5 leading-relaxed">{item.description}</Text>
          ) : null}

          {/* Owner */}
          <TouchableOpacity
            onPress={() => router.push(`/members/${item.ownerId}`)}
            className="flex-row items-center gap-3 bg-white rounded-2xl p-4 border border-[#EDE8DF] mb-5"
          >
            <View className="w-10 h-10 rounded-full bg-[#EDE8DF] items-center justify-center">
              <Text className="text-base font-semibold text-[#4A3728]">{item.ownerName.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-[#A09080]">Listed by</Text>
              <Text className="text-sm font-medium text-[#4A3728]">{item.ownerName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4B9AA" />
          </TouchableOpacity>

          {/* CTA */}
          {item.ownerId !== userId && (
            <TouchableOpacity
              onPress={() => setProposing(true)}
              className="bg-[#4A3728] rounded-full py-4 items-center flex-row justify-center gap-2"
            >
              <Ionicons name="swap-horizontal" size={18} color="#FAF7F2" />
              <Text className="text-[#FAF7F2] font-semibold">Propose Swap</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {userId && item && (
        <ProposeSwapModal
          visible={proposing}
          targetItems={[{ id: item.id, name: item.name, points: item.points, ownerId: item.ownerId, ownerName: item.ownerName }]}
          proposerId={userId}
          onClose={() => setProposing(false)}
        />
      )}
    </View>
  );
}
