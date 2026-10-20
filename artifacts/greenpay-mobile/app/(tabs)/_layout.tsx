import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";
import { GreenPayWebView } from "@/components/GreenPayWebView";

export default function AuthenticatedWebApp() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [entryUrl, setEntryUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const prepareWebSession = useCallback(async () => {
    setError("");
    setEntryUrl(null);
    try {
      const result = await api<{ code: string }>("/api/auth/mobile/webview-code", { method: "POST" });
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error("GreenPay server is not configured for this build.");
      const origin = `${domain.startsWith("http") ? "" : "https://"}${domain}`;
      setEntryUrl(`${origin}/api/auth/mobile/web-session?code=${encodeURIComponent(result.code)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "GreenPay could not be opened.");
    }
  }, []);

  useEffect(() => {
    if (user) void prepareWebSession();
  }, [prepareWebSession, user]);

  const handleWebLogout = useCallback(() => {
    void logout().finally(() => router.replace("/sign-in"));
  }, [logout, router]);

  if (loading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <View style={styles.page}>
      {entryUrl ? (
        <GreenPayWebView
          key={entryUrl}
          sourceUri={entryUrl}
          onSignOut={handleWebLogout}
          onError={() => setError("GreenPay could not load. Check your connection and try again.")}
        />
      ) : error ? (
        <View style={styles.message}>
          <Text style={styles.title}>GreenPay didn’t load</Text>
          <Text style={styles.detail}>{error}</Text>
          <Pressable onPress={() => void prepareWebSession()} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.message}>
          <ActivityIndicator color={colors.light.primary} />
          <Text style={styles.detail}>Opening your secure GreenPay account…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.light.background },
  message: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  title: { color: colors.light.foreground, fontSize: 21, fontWeight: "700", textAlign: "center" },
  detail: { color: colors.light.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  button: { marginTop: 20, minHeight: 48, borderRadius: 14, backgroundColor: colors.light.primary, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.light.primaryForeground, fontWeight: "700" },
});
