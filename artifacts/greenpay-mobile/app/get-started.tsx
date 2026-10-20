import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";

const slides = [
  {
    title: "Send money instantly",
    description: "Send money to Kenya and across Africa with just a few taps. Fast, secure, and affordable.",
    icon: "paper-plane-outline" as const,
    colors: ["#0f766e", "#14b8a6"] as const,
  },
  {
    title: "Virtual cards",
    description: "Shop online worldwide with a virtual Mastercard, ready when you are.",
    icon: "card-outline" as const,
    colors: ["#2563eb", "#0891b2"] as const,
  },
  {
    title: "Great exchange rates",
    description: "See real-time rates and know what your recipient will receive before you send.",
    icon: "trending-up-outline" as const,
    colors: ["#0f766e", "#06b6d4"] as const,
  },
  {
    title: "Your money stays protected",
    description: "Secure verification and account protections help keep your money and information safe.",
    icon: "shield-checkmark-outline" as const,
    colors: ["#ea580c", "#dc2626"] as const,
  },
];

export default function GetStartedScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const finishOnboarding = async (destination: "/sign-in" | "/sign-up") => {
    await AsyncStorage.setItem("geepay-onboarding-complete", "1");
    router.replace(destination);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#062a2a", "#083f3b", "#021716"]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require("../assets/images/icon.png")} style={styles.brandMark} />
            <Text style={styles.brandName}>Geepay</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Skip getting started" onPress={() => void finishOnboarding("/sign-in")}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {index === 0 ? (
            <Image source={require("../assets/images/icon.png")} style={styles.heroLogo} />
          ) : (
            <LinearGradient colors={slide.colors} style={styles.iconCard}>
              <Ionicons name={slide.icon} size={66} color="#fff" />
            </LinearGradient>
          )}
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots} accessibilityLabel={`Slide ${index + 1} of ${slides.length}`}>
            {slides.map((item, dotIndex) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                accessibilityLabel={`Go to slide ${dotIndex + 1}`}
                onPress={() => setIndex(dotIndex)}
                style={[styles.dot, dotIndex === index && styles.activeDot]}
              />
            ))}
          </View>
          <View style={styles.actions}>
            {index > 0 && (
              <Pressable onPress={() => setIndex(index - 1)} style={styles.backButton}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => isLast ? void finishOnboarding("/sign-up") : setIndex(index + 1)}
              style={styles.nextButton}
            >
              <Text style={styles.nextText}>{isLast ? "Get started" : "Next"}</Text>
              <Ionicons name="chevron-forward" size={19} color="#fff" />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={() => void finishOnboarding("/sign-in")} style={styles.signInLink}>
            <Text style={[styles.signInText, { color: palette.text }]}>Already have an account? <Text style={styles.signInAccent}>Sign in</Text></Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#062a2a", overflow: "hidden" },
  safe: { flex: 1, paddingHorizontal: 24 },
  glowTop: { position: "absolute", top: 90, right: -110, width: 260, height: 260, borderRadius: 130, backgroundColor: "#14b8a6", opacity: 0.14 },
  glowBottom: { position: "absolute", bottom: 80, left: -140, width: 300, height: 300, borderRadius: 150, backgroundColor: "#06b6d4", opacity: 0.1 },
  header: { minHeight: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 40, height: 40, borderRadius: 13 },
  brandName: { color: "#fff", fontSize: 19, fontWeight: "700" },
  skip: { color: "#e2e8f0", fontSize: 15, fontWeight: "600", padding: 10 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingBottom: 20 },
  iconCard: { width: 148, height: 148, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 34, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  heroLogo: { width: 154, height: 154, borderRadius: 36, marginBottom: 31 },
  title: { color: "#fff", fontSize: 30, lineHeight: 38, fontWeight: "800", textAlign: "center", marginBottom: 14 },
  description: { color: "#cbd5e1", fontSize: 16, lineHeight: 25, textAlign: "center", maxWidth: 340 },
  footer: { paddingBottom: 8 },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 9, marginBottom: 22 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.32)" },
  activeDot: { width: 28, backgroundColor: "#14b8a6" },
  actions: { flexDirection: "row", gap: 12 },
  backButton: { minWidth: 92, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(255,255,255,0.08)" },
  backText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  nextButton: { flex: 1, height: 54, borderRadius: 16, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  signInLink: { alignItems: "center", paddingVertical: 18 },
  signInText: { fontSize: 14 },
  signInAccent: { color: "#5eead4", fontWeight: "700" },
});
