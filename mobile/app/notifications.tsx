import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/lib/notificationContext";
import { useUser } from "@/lib/useUser";

const TYPE_ICONS: Record<string, string> = {
  proposal: "swap-horizontal-outline",
  accepted: "checkmark-circle-outline",
  declined: "close-circle-outline",
  dates_proposed: "calendar-outline",
  date_confirmed: "calendar-number-outline",
};

const TYPE_COLORS: Record<string, string> = {
  proposal: "#4A3728",
  accepted: "#4A6640",
  declined: "#8B3A2A",
  dates_proposed: "#2A5060",
  date_confirmed: "#2D6A4F",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markRead, markAllRead } = useNotifications();
  const { userId } = useUser();

  useEffect(() => {
    if (!userId) return;
    markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>Notifications</Text>
            <Text style={{ fontSize: 12, color: "#8B7355" }}>Your swap updates</Text>
          </View>
        </View>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={{ fontSize: 12, color: "#8B7355", textDecorationLine: "underline" }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="notifications-outline" size={48} color="#C4B9AA" />
          <Text style={{ color: "#8B7355", fontSize: 16, marginTop: 12, marginBottom: 4 }}>No notifications yet</Text>
          <Text style={{ color: "#A09080", fontSize: 13, textAlign: "center" }}>
            You'll be notified when someone proposes, accepts, or schedules a swap.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}>
          {notifications.map((n) => {
            const icon = TYPE_ICONS[n.type] ?? "notifications-outline";
            const color = TYPE_COLORS[n.type] ?? "#4A3728";
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() => {
                  markRead(n.id);
                  if (n.swap_id) router.push("/my-swaps" as any);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  backgroundColor: n.read ? "white" : "#FFF8F5",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: n.read ? "#EDE8DF" : "#D9CFC4",
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ionicons name={icon as any} size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728", flex: 1 }}>{n.title}</Text>
                    <Text style={{ fontSize: 11, color: "#A09080", marginLeft: 8, flexShrink: 0 }}>{timeAgo(n.created_at)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#6B5040", lineHeight: 18 }}>{n.body}</Text>
                </View>
                {!n.read && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#A0624A", marginTop: 4, flexShrink: 0 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
