import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

const options = [
  { title: "Send money", detail: "Transfer to another GreenPay account", icon: "send", route: "/(tabs)/send" },
  { title: "Receive money", detail: "Share your link or request a payment", icon: "download", route: "/receive" },
  { title: "Exchange", detail: "Convert between your active wallets", icon: "repeat", route: "/exchange" },
  { title: "Wallet transfer", detail: "Move funds between your own wallets", icon: "shuffle", route: "/transfer" },
  { title: "Analytics", detail: "Review your money flow and spending", icon: "bar-chart-2", route: "/analytics" },
  { title: "Withdraw", detail: "Request a bank or mobile-money payout", icon: "corner-up-right", route: "/withdraw" },
  { title: "Virtual accounts", detail: "Apply for USD, EUR, or GBP account details", icon: "globe", route: "/virtual-accounts" },
  { title: "Buy airtime", detail: "Top up a Kenyan mobile number", icon: "smartphone", route: "/airtime" },
  { title: "Pay bills", detail: "Pay electricity, water, and TV bills", icon: "file-text", route: "/bills" },
  { title: "Add money", detail: "Deposit into a GreenPay wallet", icon: "plus-circle", route: "/deposit" },
  { title: "Virtual card", detail: "View card options and purchase", icon: "credit-card", route: "/card-purchase" },
  { title: "Identity verification", detail: "Review your verification status", icon: "shield", route: "/kyc" },
  { title: "Wallets", detail: "View balances and add currencies", icon: "briefcase", route: "/(tabs)/wallets" },
  { title: "Transaction history", detail: "Review recent account activity", icon: "list", route: "/(tabs)/activity" },
  { title: "Account profile", detail: "Personal details and sign out", icon: "user", route: "/(tabs)/profile" },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.kicker}>GREENPAY</Text><Text style={s.title}>More</Text>
        <View style={s.profile}><View style={s.avatar}><Feather name="user" size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={s.name}>{user?.fullName || user?.email || "GreenPay account"}</Text><Text style={s.email}>{user?.email}</Text></View><Feather name="chevron-right" size={18} color={colors.light.mutedForeground} /></View>
        <Text style={s.section}>SERVICES</Text>
        {options.map((option) => <Pressable key={option.route} style={s.row} onPress={() => router.push(option.route as never)}>
          <View style={s.rowIcon}><Feather name={option.icon} size={18} color={colors.light.primary} /></View>
          <View style={{ flex: 1 }}><Text style={s.rowTitle}>{option.title}</Text><Text style={s.rowDetail}>{option.detail}</Text></View>
          <Feather name="chevron-right" size={17} color={colors.light.mutedForeground} />
        </Pressable>)}
        <View style={s.notice}><Feather name="lock" size={15} color={colors.light.primary} /><Text style={s.noticeText}>Your account is protected by GreenPay’s secure sign-in.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.background }, page: { padding: 20, paddingBottom: 30 },
  kicker: { color: colors.light.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 10 },
  title: { color: colors.light.foreground, fontSize: 28, fontWeight: "800", marginTop: 5, marginBottom: 20 },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, padding: 15 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center" },
  name: { color: colors.light.foreground, fontWeight: "700", fontSize: 14 }, email: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 },
  section: { color: colors.light.mutedForeground, fontWeight: "800", fontSize: 10, letterSpacing: 1.2, marginTop: 26, marginBottom: 10 },
  row: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  rowIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.light.card, alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.light.foreground, fontWeight: "700", fontSize: 13 }, rowDetail: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 },
  notice: { marginTop: 25, borderRadius: 14, padding: 14, backgroundColor: colors.light.muted, flexDirection: "row", gap: 9, alignItems: "center" },
  noticeText: { color: colors.light.mutedForeground, fontSize: 12, flex: 1 },
});
