import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/context/auth";
import { api } from "@/lib/api";
import colors from "@/constants/colors";

function getGreenPayOrigin() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error("GreenPay server is not configured for this build.");
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

const registrationCountries = [
  { code: "DZ", name: "Algeria", dialCode: "+213" }, { code: "AO", name: "Angola", dialCode: "+244" },
  { code: "BJ", name: "Benin", dialCode: "+229" }, { code: "BW", name: "Botswana", dialCode: "+267" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226" }, { code: "BI", name: "Burundi", dialCode: "+257" },
  { code: "CV", name: "Cabo Verde", dialCode: "+238" }, { code: "CM", name: "Cameroon", dialCode: "+237" },
  { code: "CF", name: "Central African Republic", dialCode: "+236" }, { code: "TD", name: "Chad", dialCode: "+235" },
  { code: "KM", name: "Comoros", dialCode: "+269" }, { code: "CG", name: "Republic of the Congo", dialCode: "+242" },
  { code: "CD", name: "Democratic Republic of the Congo", dialCode: "+243" }, { code: "CI", name: "Côte d'Ivoire", dialCode: "+225" },
  { code: "DJ", name: "Djibouti", dialCode: "+253" }, { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "GQ", name: "Equatorial Guinea", dialCode: "+240" }, { code: "ER", name: "Eritrea", dialCode: "+291" },
  { code: "SZ", name: "Eswatini", dialCode: "+268" }, { code: "ET", name: "Ethiopia", dialCode: "+251" },
  { code: "GA", name: "Gabon", dialCode: "+241" }, { code: "GM", name: "The Gambia", dialCode: "+220" },
  { code: "GH", name: "Ghana", dialCode: "+233" }, { code: "GN", name: "Guinea", dialCode: "+224" },
  { code: "GW", name: "Guinea-Bissau", dialCode: "+245" }, { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "LS", name: "Lesotho", dialCode: "+266" }, { code: "LR", name: "Liberia", dialCode: "+231" },
  { code: "LY", name: "Libya", dialCode: "+218" }, { code: "MG", name: "Madagascar", dialCode: "+261" },
  { code: "MW", name: "Malawi", dialCode: "+265" }, { code: "ML", name: "Mali", dialCode: "+223" },
  { code: "MR", name: "Mauritania", dialCode: "+222" }, { code: "MU", name: "Mauritius", dialCode: "+230" },
  { code: "MA", name: "Morocco", dialCode: "+212" }, { code: "MZ", name: "Mozambique", dialCode: "+258" },
  { code: "NA", name: "Namibia", dialCode: "+264" }, { code: "NE", name: "Niger", dialCode: "+227" },
  { code: "NG", name: "Nigeria", dialCode: "+234" }, { code: "RW", name: "Rwanda", dialCode: "+250" },
  { code: "ST", name: "São Tomé and Príncipe", dialCode: "+239" }, { code: "SN", name: "Senegal", dialCode: "+221" },
  { code: "SC", name: "Seychelles", dialCode: "+248" }, { code: "SL", name: "Sierra Leone", dialCode: "+232" },
  { code: "SO", name: "Somalia", dialCode: "+252" }, { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "SS", name: "South Sudan", dialCode: "+211" }, { code: "SD", name: "Sudan", dialCode: "+249" },
  { code: "TZ", name: "Tanzania", dialCode: "+255" }, { code: "TG", name: "Togo", dialCode: "+228" },
  { code: "TN", name: "Tunisia", dialCode: "+216" }, { code: "UG", name: "Uganda", dialCode: "+256" },
  { code: "ZM", name: "Zambia", dialCode: "+260" }, { code: "ZW", name: "Zimbabwe", dialCode: "+263" },
  { code: "US", name: "United States", dialCode: "+1" }, { code: "UK", name: "United Kingdom", dialCode: "+44" },
  { code: "CA", name: "Canada", dialCode: "+1" }, { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
];
const phoneCodes = [...new Map(registrationCountries.map(({ dialCode, name }) => [dialCode, { code: dialCode, label: `${name} (${dialCode})` }])).values()];

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+254");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");

  const createAccount = async () => {
    setBusy(true);
    setError("");
    try {
      const localPhone = phone.replace(/\D/g, "").replace(/^0+/, "");
      await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: `${phoneCode}${localPhone}`,
          country,
          password,
          agreeToTerms: acceptedTerms,
        }),
      });
      await auth.login(email.trim().toLowerCase(), password);
      router.replace("/sign-in");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  const googleSignUp = async () => {
    setGoogleBusy(true);
    setError("");
    try {
      const origin = getGreenPayOrigin();
      const redirectUri = Linking.createURL("auth/callback");
      const googleUrl = new URL("/auth/google", origin);
      googleUrl.searchParams.set("source", "mobile");
      googleUrl.searchParams.set("mobile_redirect_uri", redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(googleUrl.toString(), redirectUri);
      if (result.type !== "success" || !result.url) return;
      const returned = new URL(result.url);
      const code = returned.searchParams.get("code");
      const returnError = returned.searchParams.get("error");
      if (returnError) throw new Error("Google sign-in was cancelled or could not be completed.");
      if (!code) throw new Error("Google sign-in returned without an app code. Please try again.");
      router.replace({ pathname: "/auth/callback", params: { code } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-up could not be completed.");
    } finally {
      setGoogleBusy(false);
    }
  };

  const openLegal = (path: "terms" | "privacy") => {
    const origin = getGreenPayOrigin();
    void WebBrowser.openBrowserAsync(new URL(`/${path}`, origin).toString());
  };

  const formValid = fullName.trim().length >= 2 && email.includes("@") && phone.replace(/\D/g, "").length >= 6 &&
    country && password.length >= 8 && password === confirmPassword && acceptedTerms;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior="padding" style={styles.avoiding}>
      <KeyboardAwareScrollViewCompat
        style={styles.page}
        contentContainerStyle={[styles.content, { paddingTop: 20, paddingBottom: insets.bottom + 130 }]}
        bottomOffset={70}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("../assets/images/icon.png")} style={styles.logo} />
        <Text style={styles.eyebrow}>CREATE YOUR ACCOUNT</Text>
        <Text style={styles.title}>Welcome to Geepay</Text>
        <Text style={styles.subtitle}>Use your details as they appear on your official identification.</Text>

        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.light.mutedForeground} autoCapitalize="words" autoComplete="name" />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.light.mutedForeground} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Text style={styles.label}>Phone country code</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={phoneCode} onValueChange={(value) => setPhoneCode(String(value))} style={styles.picker}>
            {phoneCodes.map((item) => <Picker.Item key={item.code} label={item.label} value={item.code} />)}
          </Picker>
        </View>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.light.mutedForeground} keyboardType="phone-pad" autoComplete="tel-national" />
        <Text style={styles.label}>Country of residence</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={country} onValueChange={(value) => setCountry(String(value))} style={styles.picker}>
            {registrationCountries.map((item) => <Picker.Item key={item.code} label={item.name} value={item.name} />)}
          </Picker>
        </View>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password (at least 8 characters)" placeholderTextColor={colors.light.mutedForeground} secureTextEntry autoComplete="new-password" />
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor={colors.light.mutedForeground} secureTextEntry autoComplete="new-password" />

        <Pressable onPress={() => setAcceptedTerms(value => !value)} style={styles.terms}>
          <Text style={styles.checkbox}>{acceptedTerms ? "☑" : "☐"}</Text>
          <Text style={styles.termsText}>
            I agree to the <Text onPress={() => openLegal("terms")} style={styles.link}>Terms of Service</Text> and <Text onPress={() => openLegal("privacy")} style={styles.link}>Privacy Policy</Text>.
          </Text>
        </Pressable>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <View style={styles.divider}><View style={styles.rule} /><Text style={styles.dividerText}>OR SIGN UP WITH</Text><View style={styles.rule} /></View>
        <Pressable onPress={() => void googleSignUp()} disabled={googleBusy} style={styles.googleButton}>
          {googleBusy ? <ActivityIndicator color={colors.light.foreground} /> : <><Text style={styles.googleMark}>G</Text><Text style={styles.googleText}>Sign up with Google</Text></>}
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable disabled={!formValid || busy} onPress={() => void createAccount()} style={[styles.button, (!formValid || busy) && styles.disabled]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </Pressable>
        <Pressable onPress={() => router.replace("/sign-in")} style={styles.switchLink}>
          <Text style={styles.switchText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background },
  avoiding: { flex: 1 },
  page: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 22 },
  logo: { width: 52, height: 52, borderRadius: 16, marginBottom: 17 },
  eyebrow: { color: colors.light.primary, fontSize: 11, letterSpacing: 1.7, fontWeight: "800" },
  title: { color: colors.light.foreground, fontSize: 29, fontWeight: "800", marginTop: 7 },
  subtitle: { color: colors.light.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 22 },
  label: { color: colors.light.foreground, fontSize: 12, fontWeight: "700", marginBottom: 6, marginLeft: 3 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, paddingHorizontal: 15, color: colors.light.foreground, fontSize: 15, marginBottom: 12 },
  pickerWrap: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, overflow: "hidden", justifyContent: "center", marginBottom: 12 },
  picker: { color: colors.light.foreground },
  terms: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginVertical: 9 },
  checkbox: { color: colors.light.primary, fontSize: 22 },
  termsText: { flex: 1, color: colors.light.mutedForeground, fontSize: 13, lineHeight: 20, paddingTop: 3 },
  link: { color: colors.light.primary, fontWeight: "700" },
  error: { color: colors.light.destructive, fontSize: 13, marginVertical: 10 },
  divider: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 19, marginBottom: 13 },
  rule: { flex: 1, height: 1, backgroundColor: colors.light.border },
  dividerText: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  googleButton: { minHeight: 50, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, borderRadius: 14, flexDirection: "row", gap: 11, alignItems: "center", justifyContent: "center" },
  googleMark: { fontSize: 20, fontWeight: "800", color: "#4285F4" },
  googleText: { color: colors.light.foreground, fontWeight: "700", fontSize: 14 },
  footer: { paddingHorizontal: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.light.border, backgroundColor: colors.light.background },
  button: { minHeight: 52, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.5 },
  switchLink: { alignItems: "center", paddingTop: 13 },
  switchText: { color: colors.light.mutedForeground, fontSize: 13 },
});
