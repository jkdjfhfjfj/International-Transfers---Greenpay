import React, { useEffect } from "react";
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View, useColorScheme } from "react-native";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, usePathname } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/auth";
import colors from "@/constants/colors";
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function AppRoutes() {
  const { loading, user, appLocked, unlockWithBiometrics } = useAuth();
  const [unlockError, setUnlockError] = React.useState("");
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const pathname = usePathname();
  const isGettingStarted = pathname.endsWith("/get-started");
  const systemBarColor = isGettingStarted ? "#062a2a" : theme.background;

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setStyle(isGettingStarted || scheme === "dark" ? "dark" : "light");
    }
  }, [isGettingStarted, scheme, systemBarColor]);

  return (
    <>
      <StatusBar barStyle={isGettingStarted || scheme === "dark" ? "light-content" : "dark-content"} backgroundColor={systemBarColor} />
      {loading ? (
        <View style={{ flex: 1, backgroundColor: systemBarColor, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : appLocked && user ? (
        <View style={lockStyles.page}>
          <View style={lockStyles.mark}><Feather name="shield" size={30} color={theme.primary} /></View>
          <Text style={lockStyles.title}>GreenPay is locked</Text>
          <Text style={lockStyles.detail}>Verify with Face ID or fingerprint to continue.</Text>
          {!!unlockError && <Text accessibilityRole="alert" style={lockStyles.error}>{unlockError}</Text>}
          <Pressable onPress={() => { setUnlockError(""); void unlockWithBiometrics().catch((error) => setUnlockError(error instanceof Error ? error.message : "Biometric unlock failed.")); }} style={lockStyles.button}>
            <Feather name="unlock" size={18} color="#fff" /><Text style={lockStyles.buttonText}>Unlock with biometrics</Text>
          </Pressable>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="get-started" />
          <Stack.Screen name="sign-up" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="kyc-return" />
          <Stack.Screen name="payment-return" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="deposit" />
          <Stack.Screen name="card-purchase" />
          <Stack.Screen name="kyc" />
        </Stack>
      )}
    </>
  );
}

const lockStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.light.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  mark: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.light.muted, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { color: colors.light.foreground, fontSize: 24, fontWeight: "800" },
  detail: { color: colors.light.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8 },
  error: { color: colors.light.destructive, fontSize: 12, textAlign: "center", marginTop: 14 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", minHeight: 52, borderRadius: 15, backgroundColor: colors.light.primary, marginTop: 26 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => { if (fontsLoaded || fontError) void SplashScreen.hideAsync(); }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return null;
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider><AppRoutes /></AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
