import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { useAuth } from "@/context/auth";

const SIGNUP_URL = "https://geepay.us/signup";

export default function SignUpScreen() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [opening, setOpening] = useState(false);
  useEffect(() => { if (user) router.replace("/(tabs)"); }, [user, router]);
  const openSignup = async () => {
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(SIGNUP_URL, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
      await refresh();
    } finally {
      setOpening(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.light.foreground} />
        </Pressable>
        <View style={styles.icon}><Ionicons name="person-add-outline" size={34} color={colors.light.primary} /></View>
        <Text style={styles.title}>Create your Geepay account</Text>
        <Text style={styles.description}>Continue securely on Geepay to create your account. You can return to the app when you’re done.</Text>
        <Pressable style={styles.button} onPress={openSignup} disabled={opening}>
          {opening ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue to sign up</Text>}
        </Pressable>
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.signIn}>
          <Text style={styles.signInText}>Already registered? <Text style={styles.accent}>Sign in</Text></Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  page: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  back: { position: "absolute", top: 16, left: 22, padding: 10 },
  icon: { width: 70, height: 70, borderRadius: 22, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center", marginBottom: 25 },
  title: { color: colors.light.foreground, fontSize: 28, lineHeight: 35, fontWeight: "800", marginBottom: 12 },
  description: { color: colors.light.mutedForeground, fontSize: 16, lineHeight: 24, marginBottom: 28 },
  button: { height: 54, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  signIn: { alignItems: "center", paddingVertical: 20 },
  signInText: { color: colors.light.mutedForeground, fontSize: 14 },
  accent: { color: colors.light.primary, fontWeight: "700" },
});
