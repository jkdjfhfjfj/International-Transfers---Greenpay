import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export function SignIn() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [challengeMethod, setChallengeMethod] = useState<"otp" | "pin" | "authenticator" | null>(null);
  const [busy, setBusy] = useState(false);
  const [browserBusy, setBrowserBusy] = useState(false);
  const [browserError, setBrowserError] = useState("");
  const continueWithWebAuth = async () => {
    setBrowserBusy(true);
    setBrowserError("");
    try {
      const configuredDomain = process.env.EXPO_PUBLIC_DOMAIN;
      const webOrigin = configuredDomain
        ? `${configuredDomain.startsWith("http") ? "" : "https://"}${configuredDomain}`
        : "https://geepay.us";
      // Expo Go uses its own exp:// link; installed builds use greenpay-mobile://.
      const redirectUrl = Linking.createURL("auth/callback");
      const loginUrl = new URL("/login", webOrigin);
      loginUrl.searchParams.set("source", "mobile");
      loginUrl.searchParams.set("mobile_redirect_uri", redirectUrl);
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl.toString(),
        redirectUrl,
      );
      if (result.type !== "success" || !result.url) return;
      const code = new URL(result.url).searchParams.get("code");
      if (!code) throw new Error("The secure sign-in returned without an app code. Please try again.");
      router.replace({ pathname: "/auth/callback", params: { code } });
    } catch (error) {
      setBrowserError(error instanceof Error ? error.message : "Secure sign-in could not be completed.");
    } finally {
      setBrowserBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      if (challengeMethod === "otp") await auth.verifyOtp(code.trim());
      else if (challengeMethod === "pin") await auth.verifyPin(pin.trim());
      else if (challengeMethod === "authenticator") await auth.verifyAuthenticator(code.trim());
      else await auth.login(email.trim(), password);
    } catch { /* AuthContext exposes a human-readable message. */ }
    finally { setBusy(false); }
  };
  const chooseOtp = async (method: string) => {
    setChallengeMethod("otp");
    setBusy(true);
    try { await auth.requestOtp(method); }
    catch { setChallengeMethod(null); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 28 }]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <Image source={require("../assets/images/icon.png")} style={styles.brandMark} />
      <Text style={styles.eyebrow}>GEEPAY MOBILE</Text>
      <Text style={styles.title}>{auth.challenge ? "Verify it’s you" : "Welcome back"}</Text>
      <Text style={styles.subtitle}>{auth.challenge ? "Choose a verification method for your account." : "Sign in to securely access your Geepay account."}</Text>
      {!auth.challenge ? (
        <>
          <TextInput testID="signin-email" style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <TextInput testID="signin-password" style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry autoComplete="current-password" />
        </>
      ) : !challengeMethod ? (
        <View style={styles.methods}>
          {auth.challenge.requiresOtp && (auth.challenge.otpMethods || []).map(method => (
            <Pressable key={method.id} disabled={busy} onPress={() => void chooseOtp(method.id)} style={styles.methodButton}>
              <Text style={styles.methodTitle}>Send code by {method.label}</Text>
              <Text style={styles.methodDetail}>Use your verified {method.label} contact</Text>
            </Pressable>
          ))}
          {auth.challenge.requiresPin && (
            <Pressable onPress={() => setChallengeMethod("pin")} style={styles.methodButton}>
              <Text style={styles.methodTitle}>Use PIN</Text><Text style={styles.methodDetail}>Enter your account PIN</Text>
            </Pressable>
          )}
          {auth.challenge.requiresAuthenticator && (
            <Pressable onPress={() => setChallengeMethod("authenticator")} style={styles.methodButton}>
              <Text style={styles.methodTitle}>Use authenticator</Text><Text style={styles.methodDetail}>Enter a current 6-digit code</Text>
            </Pressable>
          )}
          {auth.challenge.requiresBiometric && (
          <Pressable onPress={() => void continueWithWebAuth()} style={styles.methodButton}>
              <Text style={styles.methodTitle}>Use passkey</Text><Text style={styles.methodDetail}>Verify in Geepay, then securely return to the app</Text>
            </Pressable>
          )}
        </View>
      ) : challengeMethod === "pin" ? (
        <TextInput testID="signin-pin" style={styles.input} value={pin} onChangeText={setPin} placeholder="PIN" placeholderTextColor="#64748b" keyboardType="number-pad" secureTextEntry maxLength={6} />
      ) : (
        <TextInput testID={challengeMethod === "otp" ? "signin-otp" : "signin-authenticator"} style={styles.input} value={code} onChangeText={setCode} placeholder={challengeMethod === "otp" ? "Verification code" : "Authenticator code"} placeholderTextColor="#64748b" keyboardType="number-pad" autoComplete={challengeMethod === "otp" ? "one-time-code" : "off"} maxLength={8} />
      )}
      {!!auth.error && <Text accessibilityRole="alert" style={styles.error}>{auth.error}</Text>}
      {!!browserError && <Text accessibilityRole="alert" style={styles.error}>{browserError}</Text>}
      {(!auth.challenge || challengeMethod) && (
        <Pressable testID="signin-submit" disabled={busy || (!auth.challenge && (!email.trim() || !password)) || (challengeMethod === "pin" && !pin.trim()) || ((challengeMethod === "otp" || challengeMethod === "authenticator") && !code.trim())} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || (!auth.challenge && (!email.trim() || !password)) || (challengeMethod === "pin" && !pin.trim()) || ((challengeMethod === "otp" || challengeMethod === "authenticator") && !code.trim())) && styles.disabled]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{challengeMethod ? "Verify and continue" : "Sign in"}</Text>}
        </Pressable>
      )}
      {challengeMethod && (
        <Pressable onPress={() => { setChallengeMethod(null); setCode(""); setPin(""); auth.clearError(); }} style={styles.backLink}>
          <Text style={styles.signupAccent}>Choose another verification method</Text>
        </Pressable>
      )}
      {!auth.challenge && (
        <>
          <View style={styles.separator}><View style={styles.separatorLine} /><Text style={styles.separatorText}>OR</Text><View style={styles.separatorLine} /></View>
          <Pressable onPress={continueWithWebAuth} disabled={browserBusy} style={({ pressed }) => [styles.webAuthButton, pressed && styles.pressed, browserBusy && styles.disabled]}>
            {browserBusy ? <ActivityIndicator color={colors.light.primary} /> : <Text style={styles.webAuthText}>Continue with Google or passkey</Text>}
          </Pressable>
          <Text style={styles.webAuthNote}>Sign-in opens securely and returns to GreenPay without leaving a stale session.</Text>
          <Pressable onPress={() => router.push("/sign-up")} style={styles.signupLink}>
            <Text style={styles.signupText}>New to Geepay? <Text style={styles.signupAccent}>Create an account</Text></Text>
          </Pressable>
        </>
      )}
      <Text style={styles.legal}>By continuing, you agree to Geepay’s terms and privacy policy. Use of financial features depends on availability and local rules.</Text>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.light.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 26 },
  brandMark: { width: 62, height: 62, borderRadius: 18, marginBottom: 20 },
  eyebrow: { color: colors.light.primary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { color: colors.light.foreground, fontSize: 32, lineHeight: 38, fontWeight: "700", marginTop: 10 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 26 },
  input: { height: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, paddingHorizontal: 16, color: colors.light.foreground, fontSize: 15, marginBottom: 12 },
  error: { color: colors.light.destructive, fontSize: 13, marginBottom: 12 },
  button: { height: 54, borderRadius: 16, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonText: { color: colors.light.primaryForeground, fontWeight: "700", fontSize: 15 },
  methods: { gap: 10, marginBottom: 12 },
  methodButton: { borderRadius: 14, padding: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card },
  methodTitle: { color: colors.light.foreground, fontWeight: "700", fontSize: 14 },
  methodDetail: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 4 },
  backLink: { alignItems: "center", paddingVertical: 14 },
  separator: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 19, marginBottom: 13 },
  separatorLine: { flex: 1, height: 1, backgroundColor: colors.light.border },
  separatorText: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  webAuthButton: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, alignItems: "center", justifyContent: "center" },
  webAuthText: { color: colors.light.foreground, fontSize: 14, fontWeight: "700" },
  webAuthNote: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 9 },
  signupLink: { alignItems: "center", paddingTop: 16 },
  signupText: { color: colors.light.mutedForeground, fontSize: 13 },
  signupAccent: { color: colors.light.primary, fontWeight: "700" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  legal: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 24 },
});
