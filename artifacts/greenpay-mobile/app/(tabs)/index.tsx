import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

const appDomain = process.env.EXPO_PUBLIC_DOMAIN || "";
const appOrigin = appDomain
  ? `${appDomain.startsWith("http") ? "" : "https://"}${appDomain}`.replace(/\/+$/, "")
  : "";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const webView = useRef<WebView>(null);
  const [handoffUrl, setHandoffUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webSessionReady, setWebSessionReady] = useState(false);

  const prepareHandoff = useCallback(async () => {
    if (!appOrigin) {
      setError("GreenPay is not configured for this build.");
      return;
    }
    setLoading(true);
    setError("");
    setWebSessionReady(false);
    try {
      const result = await api<{ code: string }>("/api/auth/mobile/callback-code", {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!result.code) throw new Error("GreenPay did not provide a sign-in handoff.");
      setHandoffUrl(`${appOrigin}/mobile-handoff#code=${encodeURIComponent(result.code)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open your GreenPay account.");
      setLoading(false);
    }
  }, []);

  useEffect(() => { void prepareHandoff(); }, [prepareHandoff, user?.id]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webView.current?.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigation = useCallback((state: WebViewNavigation) => {
    setCanGoBack(state.canGoBack);
    if (!state.url.startsWith(appOrigin)) return;
    try {
      const path = new URL(state.url).pathname;
      if (path === "/dashboard") setWebSessionReady(true);
      if (webSessionReady && (path === "/login" || path === "/")) {
        void logout().finally(() => router.replace("/sign-in"));
      }
    } catch {}
  }, [logout, router, webSessionReady]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn’t open GreenPay</Text>
        <Text style={styles.message}>{error}</Text>
        <Pressable onPress={() => void prepareHandoff()} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.signOut}>
          <Text style={styles.signOutText}>Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (!handoffUrl) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.light.primary} /><Text style={styles.message}>Opening your secure GreenPay account…</Text></View>;
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {loading && <View style={styles.loading}><ActivityIndicator size="large" color={colors.light.primary} /></View>}
        <iframe
          title="GreenPay account"
          src={handoffUrl}
          onLoad={() => setLoading(false)}
          style={{ border: 0, width: "100%", height: "100%" }}
          allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && <View style={styles.loading}><ActivityIndicator size="large" color={colors.light.primary} /><Text style={styles.message}>Opening your secure GreenPay account…</Text></View>}
      <WebView
        ref={webView}
        source={{ uri: handoffUrl }}
        originWhitelist={["https://*"]}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigation}
        onError={(event) => {
          setLoading(false);
          setError(event.nativeEvent.description || "The GreenPay page could not be loaded.");
        }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  webview: { flex: 1, backgroundColor: colors.light.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: colors.light.background },
  loading: { ...StyleSheet.absoluteFill, zIndex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.light.background },
  title: { color: colors.light.foreground, fontSize: 22, fontWeight: "700", textAlign: "center" },
  message: { color: colors.light.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  button: { marginTop: 24, minHeight: 50, paddingHorizontal: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.primary },
  buttonText: { color: colors.light.primaryForeground, fontSize: 15, fontWeight: "700" },
  signOut: { marginTop: 16, padding: 10 },
  signOutText: { color: colors.light.mutedForeground, fontSize: 14, fontWeight: "600" },
});
