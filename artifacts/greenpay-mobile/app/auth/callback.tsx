import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { completeExternalLogin } = useAuth();
  const router = useRouter();
  const attempted = useRef(false);
  const completeLoginRef = useRef(completeExternalLogin);
  completeLoginRef.current = completeExternalLogin;
  const [message, setMessage] = useState("Finishing secure sign-in…");

  useEffect(() => {
    let active = true;
    if (!code || attempted.current) {
      if (!code) {
      setMessage("The sign-in link is missing. Please try again.");
      }
      return () => { active = false; };
    }
    attempted.current = true;
    void completeLoginRef.current(code)
      .then(() => { if (active) router.replace("/(tabs)"); })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Sign-in could not be completed.");
      });
    return () => { active = false; };
  }, [code, router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <ActivityIndicator color={colors.light.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  page: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  message: { marginTop: 14, color: colors.light.foreground, fontSize: 15, textAlign: "center" },
});
