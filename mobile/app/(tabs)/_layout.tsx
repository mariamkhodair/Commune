import { useState, useRef, useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  Animated, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  ScrollView, Image, Dimensions, Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUnread } from "@/lib/unreadContext";
import { useNotifications } from "@/lib/notificationContext";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { tourState } from "@/lib/tourState";

const { width: SW, height: SH } = Dimensions.get("window");
const DRAWER_WIDTH = SW * 0.78;

type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; route: string };

const SECTIONS: { heading: string; items: MenuItem[] }[] = [
  {
    heading: "My Activity",
    items: [
      { label: "Notifications",      icon: "notifications-outline",       route: "/notifications" },
      { label: "My Swaps",           icon: "swap-horizontal-outline",     route: "/my-swaps" },
      { label: "Scheduled Swaps",    icon: "calendar-outline",            route: "/scheduled-swaps" },
      { label: "Communes",           icon: "triangle-outline",            route: "/communes" },
      { label: "Stuff I Want",       icon: "star-outline",                route: "/stuff-i-want" },
    ],
  },
  {
    heading: "Discover",
    items: [
      { label: "Browse Members",     icon: "person-outline",              route: "/members" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Get Help",           icon: "help-circle-outline",         route: "/help" },
      { label: "About Commune",      icon: "information-circle-outline",  route: "/about" },
      { label: "Community Guidelines", icon: "document-text-outline",     route: "/terms" },
    ],
  },
];

type TourStepDef = { type: "center" | "tab" | "drawer"; key?: string; text: string };

const TOUR: TourStepDef[] = [
  { type: "center",  text: "Welcome to Commune! Let's take a quick tour of the app." },
  { type: "tab",     key: "home",              text: "Your home feed — search items by category, member, or name." },
  { type: "tab",     key: "search",            text: "Browse all items your neighbours are offering." },
  { type: "tab",     key: "mystuff",           text: "List the items you want to swap here." },
  { type: "tab",     key: "messages",          text: "Chat with your swap partners after a swap is accepted." },
  { type: "tab",     key: "more",              text: "Tap here to open the full menu." },
  { type: "drawer",  key: "my-swaps",          text: "Accept or decline swaps — then propose meeting dates." },
  { type: "drawer",  key: "scheduled-swaps",   text: "Confirmed meetup dates show up here." },
  { type: "drawer",  key: "communes",          text: "Communes are three-way swaps — A wants B's item, B wants C's, and C wants A's. Tap 'Find' to discover triangle matches!" },
  { type: "drawer",  key: "stuff-i-want",      text: "Add items to your wish list — we'll find matches." },
  { type: "drawer",  key: "notifications",     text: "Stay on top of all swap activity." },
  { type: "drawer",  key: "browse-members",    text: "Discover who's in your community." },
  { type: "center",  text: "You're all set! Start by listing your first item." },
];

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? "#4A3728" : "#C4B9AA"} />;
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadMessages } = useUnread();
  const { unreadCount: unreadNotifications, markAllRead } = useNotifications();
  const { userId, profile } = useUser();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openDrawer() {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeDrawer(onClosed?: () => void) {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setDrawerOpen(false);
      onClosed?.();
    });
  }

  async function signOut() {
    closeDrawer(async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    });
  }

  // ── TOUR ──────────────────────────────────────────────────────────────────
  const drawerItemRefs = useRef<Record<string, any>>({});
  const [tourStep, setTourStep] = useState(-1);
  const [spotRect, setSpotRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const tourActive = tourStep >= 0 && tourStep < TOUR.length;

  useEffect(() => {
    if (tourState.consume()) setTimeout(() => setTourStep(0), 400);
  }, []);

  function getTabRect(key: string) {
    const order = ["home", "search", "mystuff", "messages", "more"];
    const idx = order.indexOf(key);
    const TW = SW / 5;
    const tabY = SH - 60 - insets.bottom;
    return { x: idx * TW, y: tabY, w: TW, h: 60 };
  }

  useEffect(() => {
    if (!tourActive) return;
    const step = TOUR[tourStep];

    if (step.type === "center") {
      if (drawerOpen) closeDrawer(() => setSpotRect(null));
      else setSpotRect(null);
      return;
    }

    if (step.type === "tab") {
      const rect = getTabRect(step.key!);
      if (drawerOpen) closeDrawer(() => setSpotRect(rect));
      else setSpotRect(rect);
      return;
    }

    if (step.type === "drawer") {
      const measure = () => {
        drawerItemRefs.current[step.key!]?.measure(
          (_fx: number, _fy: number, w: number, h: number, px: number, py: number) => {
            setSpotRect({ x: px, y: py, w, h });
          }
        );
      };
      if (!drawerOpen) { openDrawer(); setTimeout(measure, 420); }
      else setTimeout(measure, 60);
    }
  }, [tourStep]); // eslint-disable-line react-hooks/exhaustive-deps

  function tourNext() {
    if (tourStep >= TOUR.length - 1) { tourClose(); return; }
    setTourStep(s => s + 1);
  }
  function tourPrev() { if (tourStep > 0) setTourStep(s => s - 1); }
  function tourClose() {
    setTourStep(-1);
    setSpotRect(null);
    if (drawerOpen) closeDrawer();
  }

  // Spotlight padding
  const PAD = 8;
  const sp = spotRect ? {
    x: spotRect.x - PAD,
    y: spotRect.y - PAD,
    w: spotRect.w + PAD * 2,
    h: spotRect.h + PAD * 2,
  } : null;

  // Bubble width and positioning
  const BUBBLE_W = Math.min(240, SW - 40);
  const currentStep = tourActive ? TOUR[tourStep] : null;

  let bubbleLeft = (SW - BUBBLE_W) / 2;
  let bubbleBottom: number | undefined;
  let bubbleTop: number | undefined;
  let arrowCenterX = BUBBLE_W / 2; // arrow offset from bubble left

  if (sp && currentStep?.type === "tab") {
    const tabCenterX = sp.x + sp.w / 2;
    bubbleLeft = Math.max(16, Math.min(SW - BUBBLE_W - 16, tabCenterX - BUBBLE_W / 2));
    bubbleBottom = SH - sp.y + 16;
    arrowCenterX = tabCenterX - bubbleLeft;
  } else if (sp && currentStep?.type === "drawer") {
    const drawerLeft = SW - DRAWER_WIDTH;
    const drawerCenterX = drawerLeft + DRAWER_WIDTH / 2;
    bubbleLeft = Math.max(drawerLeft + 10, Math.min(SW - BUBBLE_W - 10, drawerCenterX - BUBBLE_W / 2));
    bubbleBottom = SH - sp.y + 16;
    arrowCenterX = drawerCenterX - bubbleLeft;
  } else {
    bubbleTop = SH / 2 - 120;
  }
  // ── END TOUR ──────────────────────────────────────────────────────────────

  const totalMoreBadge = unreadNotifications;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#FAF7F2",
            borderTopColor: "#EDE8DF",
            borderTopWidth: 1,
            paddingBottom: 4,
            height: 60,
          },
          tabBarActiveTintColor: "#4A3728",
          tabBarInactiveTintColor: "#C4B9AA",
          tabBarLabelStyle: { fontSize: 10, marginTop: -2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="my-stuff"
          options={{
            title: "My Stuff",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ focused }) => <TabIcon name={focused ? "chatbubble" : "chatbubble-outline"} focused={focused} />,
            tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
            tabBarBadgeStyle: { backgroundColor: "#A0624A", fontSize: 10, minWidth: 18, height: 18 },
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ focused }) => <TabIcon name={drawerOpen ? "menu" : "menu-outline"} focused={drawerOpen} />,
            tabBarBadge: totalMoreBadge > 0 ? totalMoreBadge : undefined,
            tabBarBadgeStyle: { backgroundColor: "#A0624A", fontSize: 10, minWidth: 18, height: 18 },
            tabBarButton: (props) => (
              <TouchableOpacity
                style={props.style}
                onPress={drawerOpen ? () => closeDrawer() : openDrawer}
                accessibilityLabel="More"
              >
                {props.children}
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>

      {/* Sidebar drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop — disabled during tour so accidental tap doesn't close drawer */}
          <TouchableWithoutFeedback onPress={tourActive ? undefined : () => closeDrawer()}>
            <Animated.View
              style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(74,55,40,0.45)",
                opacity: backdropAnim,
              }}
            />
          </TouchableWithoutFeedback>

          {/* Sidebar panel */}
          <Animated.View
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0,
              width: DRAWER_WIDTH,
              backgroundColor: "#FAF7F2",
              transform: [{ translateX: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: -4, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "bottom"]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* Profile header */}
                <TouchableOpacity
                  onPress={() => closeDrawer(() => router.push("/profile" as any))}
                  style={{ alignItems: "center", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 }}
                >
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#EDE8DF", alignItems: "center", justifyContent: "center", marginBottom: 10, overflow: "hidden" }}>
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} />
                    ) : (
                      <Text style={{ color: "#4A3728", fontSize: 24, fontWeight: "bold" }}>{profile?.name?.charAt(0) ?? "?"}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#4A3728" }}>{profile?.name ?? "Loading..."}</Text>
                    <Ionicons name="pencil-outline" size={14} color="#8B7355" />
                  </View>
                  {profile?.area ? (
                    <Text style={{ fontSize: 13, color: "#8B7355" }}>{profile.area}, {profile.city}</Text>
                  ) : null}
                </TouchableOpacity>

                {/* Sections */}
                {SECTIONS.map(({ heading, items }) => (
                  <View key={heading} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09080", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                      {heading}
                    </Text>
                    <View style={{ gap: 6 }}>
                      {items.map(({ label, icon, route }) => {
                        const isNotifications = label === "Notifications";
                        const badgeCount = isNotifications ? unreadNotifications : 0;
                        const refKey = label.toLowerCase().replace(/\s+/g, "-");
                        return (
                          <TouchableOpacity
                            key={label}
                            ref={(r) => { drawerItemRefs.current[refKey] = r; }}
                            onPress={() => {
                              if (isNotifications) markAllRead();
                              closeDrawer(() => router.push(route as any));
                            }}
                            style={{
                              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                              backgroundColor: "white", borderRadius: 16,
                              paddingHorizontal: 16, paddingVertical: 14,
                              borderWidth: 1, borderColor: "#EDE8DF",
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <Ionicons name={icon} size={18} color="#8B7355" />
                              <Text style={{ fontSize: 14, color: "#4A3728" }}>{label}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {badgeCount > 0 && (
                                <View style={{ backgroundColor: "#A0624A", borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" }}>
                                  <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>{badgeCount}</Text>
                                </View>
                              )}
                              <Ionicons name="chevron-forward" size={16} color="#C4B9AA" />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Sign out */}
                <View style={{ paddingHorizontal: 20 }}>
                  <TouchableOpacity
                    onPress={signOut}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 999, borderWidth: 1, borderColor: "#D9CFC4" }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#A09080" />
                    <Text style={{ fontSize: 14, color: "#A09080" }}>Sign Out</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </>
      )}

      {/* ── TOUR OVERLAY ───────────────────────────────────────────────────── */}
      {tourActive && (
        <Modal transparent visible animationType="none" statusBarTranslucent>
          <View style={{ flex: 1 }}>

            {/* Dark overlay: full screen or 4-rect spotlight */}
            {sp ? (
              <>
                <View style={{ position: "absolute", left: 0, right: 0, top: 0, height: sp.y, backgroundColor: "rgba(50,35,22,0.75)" }} />
                <View style={{ position: "absolute", left: 0, width: sp.x, top: sp.y, height: sp.h, backgroundColor: "rgba(50,35,22,0.75)" }} />
                <View style={{ position: "absolute", left: sp.x + sp.w, right: 0, top: sp.y, height: sp.h, backgroundColor: "rgba(50,35,22,0.75)" }} />
                <View style={{ position: "absolute", left: 0, right: 0, top: sp.y + sp.h, bottom: 0, backgroundColor: "rgba(50,35,22,0.75)" }} />
                {/* Spotlight border */}
                <View style={{ position: "absolute", left: sp.x, top: sp.y, width: sp.w, height: sp.h, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" }} pointerEvents="none" />
              </>
            ) : (
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(50,35,22,0.75)" }} />
            )}

            {/* Tooltip bubble */}
            <View
              style={{
                position: "absolute",
                left: bubbleLeft,
                ...(bubbleBottom !== undefined ? { bottom: bubbleBottom } : { top: bubbleTop }),
                width: BUBBLE_W,
                backgroundColor: "white",
                borderRadius: 18,
                padding: 16,
                borderWidth: 1.5,
                borderColor: "#EDE8DF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              {/* Downward arrow pointing at the spotlight */}
              {sp && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -7,
                    left: Math.max(8, Math.min(BUBBLE_W - 22, arrowCenterX - 7)),
                    width: 14,
                    height: 14,
                    transform: [{ rotate: "45deg" }],
                    backgroundColor: "white",
                    borderRightWidth: 1.5,
                    borderBottomWidth: 1.5,
                    borderColor: "#EDE8DF",
                  }}
                />
              )}

              <Text style={{ fontSize: 13, color: "#4A3728", lineHeight: 20, marginBottom: 14 }}>
                {currentStep?.text}
              </Text>

              {/* Progress dots */}
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
                {TOUR.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 4,
                      width: i === tourStep ? 14 : 4,
                      borderRadius: 999,
                      backgroundColor: i === tourStep ? "#4A3728" : "#D9CFC4",
                    }}
                  />
                ))}
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {tourStep > 0 && (
                  <TouchableOpacity
                    onPress={tourPrev}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: "#D9CFC4", alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "500", color: "#6B5040" }}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={tourNext}
                  style={{ flex: 2, paddingVertical: 8, borderRadius: 999, backgroundColor: "#4A3728", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FAF7F2" }}>
                    {tourStep === TOUR.length - 1 ? "Done!" : "Next →"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Step count + skip */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={{ fontSize: 10, color: "#C4B9AA" }}>{tourStep + 1} / {TOUR.length}</Text>
                {tourStep < TOUR.length - 1 && (
                  <TouchableOpacity onPress={tourClose}>
                    <Text style={{ fontSize: 10, color: "#A09080" }}>Skip tour</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

          </View>
        </Modal>
      )}
      {/* ── END TOUR ────────────────────────────────────────────────────────── */}

    </View>
  );
}
