import { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Path } from "react-native-svg";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import { UnreadProvider } from "@/lib/unreadContext";
import { NotificationProvider } from "@/lib/notificationContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const { width: W, height: H } = Dimensions.get("window");
const S = Math.min(W, H) * 0.38; // leaf corner size

function LeafBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="none">
      {/* Top-left */}
      <Svg width={S} height={S} viewBox="0 0 200 200" style={{ position: "absolute", top: 0, left: 0 }}>
        <Path d="M0,100 Q30,60 70,40 Q100,0 140,10 Q100,50 90,80 Q70,110 20,120 Z" fill="#7A9E6E" fillOpacity={0.22} />
        <Path d="M0,160 Q40,110 90,100 Q60,140 30,170 Q10,180 0,170 Z" fill="#5C7A4E" fillOpacity={0.16} />
        <Path d="M30,0 Q80,20 60,70 Q35,55 10,25 Z" fill="#9AB88A" fillOpacity={0.19} />
      </Svg>
      {/* Top-right */}
      <Svg width={S} height={S} viewBox="0 0 200 200" style={{ position: "absolute", top: 0, right: 0 }}>
        <Path d="M200,100 Q170,60 130,40 Q100,0 60,10 Q100,50 110,80 Q130,110 180,120 Z" fill="#7A9E6E" fillOpacity={0.22} />
        <Path d="M200,160 Q160,110 110,100 Q140,140 170,170 Q190,180 200,170 Z" fill="#5C7A4E" fillOpacity={0.16} />
        <Path d="M170,0 Q120,20 140,70 Q165,55 190,25 Z" fill="#9AB88A" fillOpacity={0.19} />
      </Svg>
      {/* Bottom-left */}
      <Svg width={S} height={S} viewBox="0 0 200 200" style={{ position: "absolute", bottom: 0, left: 0 }}>
        <Path d="M0,100 Q30,140 70,160 Q100,200 140,190 Q100,150 90,120 Q70,90 20,80 Z" fill="#7A9E6E" fillOpacity={0.22} />
        <Path d="M30,200 Q80,180 60,130 Q35,145 10,175 Z" fill="#9AB88A" fillOpacity={0.19} />
      </Svg>
      {/* Bottom-right */}
      <Svg width={S} height={S} viewBox="0 0 200 200" style={{ position: "absolute", bottom: 0, right: 0 }}>
        <Path d="M200,100 Q170,140 130,160 Q100,200 60,190 Q100,150 110,120 Q130,90 180,80 Z" fill="#7A9E6E" fillOpacity={0.22} />
        <Path d="M170,200 Q120,180 140,130 Q165,145 190,175 Z" fill="#9AB88A" fillOpacity={0.19} />
        <Path d="M200,60 Q160,110 110,100 Q140,70 180,50 Z" fill="#5C7A4E" fillOpacity={0.16} />
      </Svg>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale or invalid refresh token — clear it and send to login
        supabase.auth.signOut();
        setSession(false);
        setUserId(null);
        return;
      }
      setSession(!!session);
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        setSession(true);
        setUserId(s?.user?.id ?? null);
      } else if (event === "SIGNED_OUT") {
        setSession(false);
        setUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Register for push notifications and save token to profile
  useEffect(() => {
    if (!userId) return;
    (async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await supabase.from("profiles").update({ expo_push_token: token }).eq("id", userId);
    })();
  }, [userId]);

  useEffect(() => {
    if (session === null) return;
    const inAuth = segments[0] === "(auth)";
    if (!session && !inAuth) router.replace("/(auth)/login");
    if (session && inAuth) router.replace("/(tabs)");
  }, [session, segments]);

  return (
    <UnreadProvider>
      <NotificationProvider userId={userId}>
        <View style={{ flex: 1, backgroundColor: "#FAF7F2" }}>
          <StatusBar style="dark" backgroundColor="transparent" translucent />
          <Stack screenOptions={{ headerShown: false }} />
          <LeafBackground />
        </View>
      </NotificationProvider>
    </UnreadProvider>
  );
}
