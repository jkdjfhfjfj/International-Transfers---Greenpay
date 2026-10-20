import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

export function SignIn() {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      if (auth.pendingOtp) await auth.verifyOtp(code.trim());
      else await auth.login(email.trim(), password);
    } catch { /* AuthContext exposes a human-readable message. */ }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 28 }]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>G</Text></View>
      <Text style={styles.eyebrow}>GREENPAY MOBILE</Text>
      <Text style={styles.title}>{auth.pendingOtp ? "Verify it’s you" : "Money, in motion."}</Text>
      <Text style={styles.subtitle}>{auth.pendingOtp ? "Enter the verification code sent to your account." : "Sign in to securely access your GreenPay account."}</Text>
      {!auth.pendingOtp ? (
        <>
          <TextInput testID="signin-email" style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <TextInput testID="signin-password" style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry autoComplete="current-password" />
        </>
      ) : (
        <TextInput testID="signin-otp" style={styles.input} value={code} onChangeText={setCode} placeholder="Verification code" placeholderTextColor="#64748b" keyboardType="number-pad" autoComplete="one-time-code" maxLength={8} />
      )}
      {!!auth.error && <Text accessibilityRole="alert" style={styles.error}>{auth.error}</Text>}
      <Pressable testID="signin-submit" disabled={busy || (!auth.pendingOtp && (!email.trim() || !password)) || (auth.pendingOtp && !code.trim())} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || (!auth.pendingOtp && (!email.trim() || !password)) || (auth.pendingOtp && !code.trim())) && styles.disabled]}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{auth.pendingOtp ? "Verify and continue" : "Sign in"}</Text>}
      </Pressable>
      <Text style={styles.legal}>By continuing, you agree to GreenPay’s terms and privacy policy. Use of financial features depends on availability and local rules.</Text>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.light.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 26 },
  brandMark: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  brandMarkText: { color: colors.light.primaryForeground, fontSize: 30, fontWeight: "700" },
  eyebrow: { color: colors.light.primary, fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { color: colors.light.foreground, fontSize: 32, lineHeight: 38, fontWeight: "700", marginTop: 10 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: 9, marginBottom: 26 },
  input: { height: 54, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, paddingHorizontal: 16, color: colors.light.foreground, fontSize: 15, marginBottom: 12 },
  error: { color: colors.light.destructive, fontSize: 13, marginBottom: 12 },
  button: { height: 54, borderRadius: 16, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonText: { color: colors.light.primaryForeground, fontWeight: "700", fontSize: 15 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.55 },
  legal: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 24 },
});
