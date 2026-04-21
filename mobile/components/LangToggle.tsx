import { TouchableOpacity, Text } from "react-native";
import { useLang } from "@/lib/languageContext";

// Small pill button that switches between English and Arabic.
// Place it wherever the design requires a language toggle.
export function LangToggle({ style }: { style?: object }) {
  const { lang, setLang } = useLang();
  return (
    <TouchableOpacity
      onPress={() => setLang(lang === "en" ? "ar" : "en")}
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "#D9CFC4",
          backgroundColor: "rgba(255,255,255,0.85)",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#4A3728" }}>
        {lang === "en" ? "العربية" : "English"}
      </Text>
    </TouchableOpacity>
  );
}
