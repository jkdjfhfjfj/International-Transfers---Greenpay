import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";

type Step = "email" | "verify" | "details";

export default function SignUpScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    setBusy(true); setError("");
    try {
      const result = await api<{ previewCode?: string }>("/api/auth/mobile-signup/start", {
        method: "POST", body: JSON.stringify({ email }),
      });
      setPreviewCode(result.previewCode || "");
      setStep("verify");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send your code.");
    } finally { setBusy(false); }
  };

  const verifyEmail = async () => {
    setBusy(true); setError("");
    try {
      await api("/api/auth/mobile-signup/verify-email", {
        method: "POST", body: JSON.stringify({ code }),
      });
      setStep("details");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not verify that code.");
    } finally { setBusy(false); }
  };

  const createAccount = async () => {
    setBusy(true); setError("");
    try {
      const result = await api<{ success: boolean }>("/api/auth/mobile-signup/complete", {
        method: "POST",
        body: JSON.stringify({ fullName, phone, country, password, confirmPassword, agreeToTerms: acceptedTerms }),
      });
      if (!result.success) throw new Error("Could not finish creating your account.");
      await refresh();
      router.replace("/(tabs)");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not finish creating your account.");
    } finally { setBusy(false); }
  };

  const input = (value: string, onChangeText: (value: string) => void, placeholder: string, props: Partial<React.ComponentProps<typeof TextInput>> = {}) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.light.mutedForeground}
      style={styles.input}
      autoCapitalize="none"
      {...props}
    />
  );
  const buttonLabel = step === "email" ? "Send verification code" : step === "verify" ? "Verify email" : "Create account";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll} bottomOffset={28}>
        <Pressable onPress={() => step === "email" ? router.back() : setStep(step === "details" ? "verify" : "email")} style={styles.back}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>
        <Image source={require("../assets/images/icon.png")} style={styles.logo} />
        <Text style={styles.stepLabel}>STEP {step === "email" ? "1" : step === "verify" ? "2" : "3"} OF 3</Text>
        <Text style={styles.title}>{step === "email" ? "Start with your email" : step === "verify" ? "Verify your email" : "Your account details"}</Text>
        <Text style={styles.subtitle}>
          {step === "email" ? "We’ll send a one-time code before you enter your details." :
            step === "verify" ? `Enter the 6-digit code sent to ${email}.` : "Add your details to finish setting up your Geepay account."}
        </Text>

        {step === "email" && input(email, setEmail, "Email address", { keyboardType: "email-address", textContentType: "emailAddress", autoComplete: "email" })}
        {step === "verify" && <>
          {input(code, (value) => setCode(value.replace(/\D/g, "").slice(0, 6)), "6-digit verification code", { keyboardType: "number-pad", maxLength: 6, textContentType: "oneTimeCode" })}
          {previewCode ? <Text style={styles.previewCode}>Preview email code: {previewCode}</Text> : null}
          <Pressable onPress={() => { setStep("email"); setCode(""); }}><Text style={styles.link}>Use a different email</Text></Pressable>
        </>}
        {step === "details" && <>
          {input(fullName, setFullName, "Full name", { autoCapitalize: "words", textContentType: "name" })}
          {input(phone, setPhone, "Phone number", { keyboardType: "phone-pad", textContentType: "telephoneNumber" })}
          {input(country, setCountry, "Country of residence", { autoCapitalize: "words" })}
          {input(password, setPassword, "Password (at least 8 characters)", { secureTextEntry: true, textContentType: "newPassword" })}
          {input(confirmPassword, setConfirmPassword, "Confirm password", { secureTextEntry: true, textContentType: "newPassword" })}
          <Pressable onPress={() => setAcceptedTerms((accepted) => !accepted)} style={styles.terms}>
            <Text style={styles.checkbox}>{acceptedTerms ? "☑" : "☐"}</Text>
            <Text style={styles.termsText}>I agree to Geepay’s terms and privacy policy.</Text>
          </Pressable>
        </>}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={() => void (step === "email" ? requestCode() : step === "verify" ? verifyEmail() : createAccount())}
          disabled={busy || (step === "email" && !email.trim()) || (step === "verify" && code.length !== 6) ||
            (step === "details" && (!fullName.trim() || !phone.trim() || !country.trim() || password.length < 8 || password !== confirmPassword || !acceptedTerms))}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{buttonLabel}</Text>}
        </Pressable>
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.signIn}>
          <Text style={styles.signInText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 28 },
  back: { alignSelf: "flex-start", paddingVertical: 12, marginBottom: 18 },
  backText: { color: colors.light.foreground, fontSize: 16, fontWeight: "600" },
  logo: { width: 58, height: 58, borderRadius: 18, marginBottom: 24 },
  stepLabel: { color: colors.light.primary, fontSize: 12, fontWeight: "800", letterSpacing: 1.6, marginBottom: 10 },
  title: { color: colors.light.foreground, fontSize: 28, lineHeight: 35, fontWeight: "800", marginBottom: 10 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 15, lineHeight: 23, marginBottom: 24 },
  input: { minHeight: 54, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderRadius: 14, paddingHorizontal: 16, color: colors.light.foreground, fontSize: 16, marginBottom: 13 },
  previewCode: { color: colors.light.primary, fontWeight: "700", marginBottom: 14 },
  terms: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 10 },
  checkbox: { color: colors.light.primary, fontSize: 22 },
  termsText: { flex: 1, color: colors.light.mutedForeground, fontSize: 13, lineHeight: 19 },
  error: { color: "#b91c1c", fontSize: 14, marginVertical: 10 },
  button: { minHeight: 54, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.5 },
  signIn: { alignItems: "center", paddingVertical: 22 },
  signInText: { color: colors.light.mutedForeground, fontSize: 14 },
  link: { color: colors.light.primary, fontWeight: "700" },
});
