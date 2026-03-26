import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { tourState } from "@/lib/tourState";

export default function Tutorial() {
  const router = useRouter();
  useEffect(() => {
    tourState.trigger();
    router.replace("/(tabs)");
  }, [router]);
  return <View style={{ flex: 1, backgroundColor: "#FAF7F2" }} />;
}
