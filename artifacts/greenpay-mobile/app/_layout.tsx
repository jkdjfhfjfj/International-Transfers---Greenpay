import React, { useEffect } from "react";
import { ActivityIndicator, Platform, StatusBar, View, useColorScheme } from "react-native";
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
  const { loading } = useAuth();
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
