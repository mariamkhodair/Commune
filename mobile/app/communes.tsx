import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const API_BASE = "https://commune-neon.vercel.app";

// ── Types ──────────────────────────────────────────────────────────────────────

type ItemSnap = { id: string; name: string; points: number; photos: string[] | null };
type ProfileSnap = { id: string; name: string; avatar_url: string | null };

type CommuneMatch = {
  memberAId: string; memberBId: string; memberCId: string;
  itemA: ItemSnap; itemB: ItemSnap; itemC: ItemSnap;
  profileA: ProfileSnap; profileB: ProfileSnap; profileC: ProfileSnap;
};

type Commune = {
  id: string; status: string; proposed_by: string;
  member_a_id: string; member_b_id: string; member_c_id: string;
  itemA: ItemSnap; itemB: ItemSnap; itemC: ItemSnap;
  profileA: ProfileSnap; profileB: ProfileSnap; profileC: ProfileSnap;
  acceptances: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data: { session: refreshed } } = await supabase.auth.refreshSession();
  if (refreshed?.access_token) return refreshed.access_token;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

function Avatar({ profile, size = 28 }: { profile: ProfileSnap | null; size?: number }) {
  if (!profile) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {profile.avatar_url
        ? <Image source={{ uri: profile.avatar_url }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.4, color: "#4A3728", fontWeight: "600" }}>{profile.name.charAt(0)}</Text>}
    </View>
  );
}

function ItemThumb({ item }: { item: ItemSnap | null }) {
  if (!item) return null;
  const photo = item.photos?.[0];
  return (
    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: "#EDE8DF", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
      {photo
        ? <Image source={{ uri: photo }} style={{ width: 36, height: 36 }} />
        : <Text style={{ fontSize: 9, color: "#8B7355", textAlign: "center", paddingHorizontal: 2 }} numberOfLines={2}>{item.name}</Text>}
    </View>
  );
}

function ptsLabel(a: number, b: number, c: number) {
  const diff = Math.max(a, b, c) - Math.min(a, b, c);
  return diff === 0 ? "Perfectly balanced" : `±${diff} pts spread`;
}

// ── Match card ─────────────────────────────────────────────────────────────────

function MatchCard({ match, userId, onPropose }: { match: CommuneMatch; userId: string; onPropose: (m: CommuneMatch) => void }) {
  const rows = [
    { giver: match.profileA, item: match.itemA, receiver: match.profileC, isMe: match.memberAId === userId },
    { giver: match.profileB, item: match.itemB, receiver: match.profileA, isMe: match.memberBId === userId },
    { giver: match.profileC, item: match.itemC, receiver: match.profileB, isMe: match.memberCId === userId },
  ];

  return (
    <View style={{ backgroundColor: "white", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}>
      <View style={{ backgroundColor: "#4A3728", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: "#FAF7F2", fontSize: 13, fontWeight: "600" }}>Commune Match</Text>
        <Text style={{ marginLeft: "auto", color: "#C4B9AA", fontSize: 11 }}>{ptsLabel(match.itemA.points, match.itemB.points, match.itemC.points)}</Text>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        {rows.map(({ giver, item, receiver, isMe }, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Avatar profile={giver} size={22} />
            <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: isMe ? "700" : "400" }}>{isMe ? "You" : giver?.name}</Text>
            <Text style={{ fontSize: 11, color: "#A09080" }}>give</Text>
            <ItemThumb item={item} />
            <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: "500" }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 11, color: "#A09080" }}>→</Text>
            <Avatar profile={receiver} size={22} />
            <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: receiver?.id === userId ? "700" : "400" }}>
              {receiver?.id === userId ? "You" : receiver?.name}
            </Text>
          </View>
        ))}
        <TouchableOpacity
          onPress={() => onPropose(match)}
          style={{ marginTop: 4, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#FAF7F2", fontSize: 14, fontWeight: "600" }}>Propose Commune</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Active commune card ────────────────────────────────────────────────────────

function CommuneCard({ commune, userId, onAction }: { commune: Commune; userId: string; onAction: () => void }) {
  const [acting, setActing] = useState(false);

  const members = [commune.member_a_id, commune.member_b_id, commune.member_c_id];
  const profiles: Record<string, ProfileSnap> = {
    [commune.member_a_id]: commune.profileA,
    [commune.member_b_id]: commune.profileB,
    [commune.member_c_id]: commune.profileC,
  };
  const items: Record<string, ItemSnap> = {
    [commune.member_a_id]: commune.itemA,
    [commune.member_b_id]: commune.itemB,
    [commune.member_c_id]: commune.itemC,
  };
  const receivers: Record<string, string> = {
    [commune.member_a_id]: commune.member_c_id,
    [commune.member_b_id]: commune.member_a_id,
    [commune.member_c_id]: commune.member_b_id,
  };

  const myAccepted = commune.acceptances.includes(userId);
  const isPending = commune.status === "Proposed" && !myAccepted;

  async function act(action: "accept" | "decline") {
    if (action === "decline") {
      const confirmed = await new Promise<boolean>(resolve =>
        Alert.alert("Decline Commune?", "This will cancel the commune for all three members.", [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          { text: "Decline", style: "destructive", onPress: () => resolve(true) },
        ])
      );
      if (!confirmed) return;
    }
    setActing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/communes/${commune.id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        Alert.alert("Error", (j as { error?: string }).error ?? `Failed to ${action}`);
        return;
      }
      onAction();
    } finally {
      setActing(false);
    }
  }

  const statusColor = commune.status === "In Progress" ? "#D8E4D0" : commune.status === "Declined" ? "#FEE2E2" : "#FEF3C7";
  const statusText = commune.status === "Proposed" ? `${commune.acceptances.length}/3 accepted` : commune.status;

  return (
    <View style={{ backgroundColor: "white", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#EDE8DF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EDE8DF" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 16 }}>🔺</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#4A3728" }}>Commune</Text>
        </View>
        <View style={{ backgroundColor: statusColor, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#4A3728" }}>{statusText}</Text>
        </View>
      </View>

      <View style={{ padding: 14, gap: 10 }}>
        {members.map(memberId => {
          const profile = profiles[memberId];
          const item = items[memberId];
          const receiver = profiles[receivers[memberId]];
          const isMe = memberId === userId;
          return (
            <View key={memberId} style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <Avatar profile={profile} size={22} />
              <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: isMe ? "700" : "400" }}>{isMe ? "You" : profile?.name}</Text>
              <Text style={{ fontSize: 11, color: "#A09080" }}>give</Text>
              <ItemThumb item={item} />
              <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: "500" }} numberOfLines={1}>{item?.name}</Text>
              <Text style={{ fontSize: 11, color: "#A09080" }}>→</Text>
              <Avatar profile={receiver} size={22} />
              <Text style={{ fontSize: 12, color: "#4A3728", fontWeight: receiver?.id === userId ? "700" : "400" }}>
                {receiver?.id === userId ? "You" : receiver?.name}
              </Text>
            </View>
          );
        })}

        {isPending && (
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => act("decline")}
              disabled={acting}
              style={{ flex: 1, borderWidth: 1, borderColor: "#D9CFC4", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, color: "#6B5040" }}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => act("accept")}
              disabled={acting}
              style={{ flex: 1, backgroundColor: "#4A3728", borderRadius: 999, paddingVertical: 11, alignItems: "center" }}
            >
              {acting ? <ActivityIndicator color="white" size="small" /> : <Text style={{ fontSize: 14, fontWeight: "600", color: "#FAF7F2" }}>Accept</Text>}
            </TouchableOpacity>
          </View>
        )}

        {commune.status === "Proposed" && myAccepted && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#2D6A4F" }} />
            <Text style={{ fontSize: 12, color: "#2D6A4F" }}>You accepted — waiting for the others</Text>
          </View>
        )}

        {commune.status === "In Progress" && (
          <View style={{ marginTop: 4, gap: 6 }}>
            <Text style={{ fontSize: 12, color: "#2D5030", fontWeight: "500" }}>Commune is active — coordinate your exchange with the other members.</Text>
            <TouchableOpacity onPress={() => act("decline")} disabled={acting}>
              <Text style={{ fontSize: 11, color: "#A09080", textDecorationLine: "underline" }}>Cancel commune</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function CommunesScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [findLoading, setFindLoading] = useState(false);
  const [findResults, setFindResults] = useState<CommuneMatch[] | null>(null);
  const [proposing, setProposing] = useState(false);

  const fetchCommunes = useCallback(async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/communes`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCommunes((await res.json()).communes ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchCommunes(); }, [fetchCommunes]);

  async function findCommune() {
    setFindLoading(true);
    setFindResults(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/communes/find`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { matches } = await res.json();
        setFindResults(matches ?? []);
        if (!matches?.length) Alert.alert("No communes found", "No triangle matches yet. Try adding more items to your Stuff I Want list.");
      }
    } finally {
      setFindLoading(false);
    }
  }

  async function propose(match: CommuneMatch) {
    setProposing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/communes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          memberBId: match.memberBId,
          memberCId: match.memberCId,
          itemAId: match.itemA.id,
          itemBId: match.itemB.id,
          itemCId: match.itemC.id,
        }),
      });
      if (res.ok) {
        setFindResults(null);
        fetchCommunes();
      } else {
        const j = await res.json().catch(() => ({}));
        Alert.alert("Error", (j as { error?: string }).error ?? "Failed to propose commune");
      }
    } finally {
      setProposing(false);
    }
  }

  const proposed = communes.filter(c => c.status === "Proposed");
  const active = communes.filter(c => c.status === "In Progress");
  const past = communes.filter(c => c.status === "Declined" || c.status === "Completed");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
            <Ionicons name="arrow-back" size={18} color="#4A3728" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "300", color: "#4A3728" }}>Communes</Text>
            <Text style={{ fontSize: 12, color: "#8B7355" }}>Three-way swaps</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={findCommune}
          disabled={findLoading || proposing}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#4A3728", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          {findLoading
            ? <ActivityIndicator color="white" size="small" />
            : <><Text style={{ fontSize: 14 }}>🔺</Text><Text style={{ fontSize: 13, fontWeight: "600", color: "#FAF7F2" }}>Find</Text></>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#4A3728" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCommunes(); }} tintColor="#4A3728" />}
        >
          {/* Find results */}
          {findResults !== null && findResults.length > 0 && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#4A3728" }}>{findResults.length} match{findResults.length !== 1 ? "es" : ""} found</Text>
                <TouchableOpacity onPress={() => setFindResults(null)}>
                  <Text style={{ fontSize: 12, color: "#A09080", textDecorationLine: "underline" }}>Close</Text>
                </TouchableOpacity>
              </View>
              {findResults.map((match, i) => (
                <View key={i} style={proposing ? { opacity: 0.5 } : {}}>
                  <MatchCard match={match} userId={userId ?? ""} onPropose={propose} />
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {communes.length === 0 && findResults === null && (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔺</Text>
              <Text style={{ fontSize: 18, color: "#8B7355", fontWeight: "300", marginBottom: 6 }}>No communes yet</Text>
              <Text style={{ fontSize: 13, color: "#A09080", textAlign: "center", lineHeight: 20, maxWidth: 260 }}>
                A commune is a three-way swap — three members each giving one item to form a circle. Tap Find to discover matches.
              </Text>
            </View>
          )}

          {/* Sections */}
          {proposed.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1 }}>Pending Acceptance</Text>
              {proposed.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
            </View>
          )}
          {active.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1 }}>In Progress</Text>
              {active.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
            </View>
          )}
          {past.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1 }}>Past</Text>
              {past.map(c => <CommuneCard key={c.id} commune={c} userId={userId ?? ""} onAction={fetchCommunes} />)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
