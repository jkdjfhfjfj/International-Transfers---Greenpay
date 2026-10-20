import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

export type MobileWalletCardData = {
  id: string;
  currency: string;
  balance: string | number;
  availableBalance?: string | number;
  holdAmount?: string | number;
  withdrawalHoldAmount?: string | number;
  isDefault?: boolean;
  isSuspended?: boolean;
  label?: string;
  isActive?: boolean;
};

const palette: Record<string, [string, string]> = {
  USD: ["#059669", "#0f766e"], KES: ["#dc2626", "#f97316"], EUR: ["#1d4ed8", "#6366f1"],
  GBP: ["#4338ca", "#7c3aed"], UGX: ["#ca8a04", "#f97316"], NGN: ["#15803d", "#16a34a"],
  GHS: ["#dc2626", "#16a34a"], ZAR: ["#2563eb", "#eab308"], TZS: ["#0891b2", "#2563eb"],
};

export default function WalletCard({ wallet, selected, showBalance = true, onPress }: {
  wallet: MobileWalletCardData; selected?: boolean; showBalance?: boolean; onPress?: () => void;
}) {
  const hold = Number(wallet.holdAmount || 0) + Number(wallet.withdrawalHoldAmount || 0);
  const available = Number(wallet.availableBalance ?? (Number(wallet.balance || 0) - hold));
  const gradient = palette[wallet.currency] || ["#475569", "#1e293b"];
  const symbol = wallet.currency === "KES" ? "KSh " : wallet.currency === "EUR" ? "€" : wallet.currency === "GBP" ? "£" : `${wallet.currency} `;
  return (
    <Pressable onPress={onPress} accessibilityRole={onPress ? "button" : undefined} style={[s.outer, selected && s.selected]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.top}><View><Text style={s.label}>{wallet.label || `${wallet.currency} wallet`}</Text><Text style={s.currency}>{wallet.currency}</Text></View>
          {wallet.isDefault ? <View style={s.badge}><Feather name="star" size={10} color="#fff" /><Text style={s.badgeText}>DEFAULT</Text></View> : null}</View>
        {wallet.isSuspended ? <Text style={s.status}>Wallet suspended</Text> : hold > 0 ? <Text style={s.status}>On hold · {symbol}{hold.toFixed(2)}</Text> : null}
        <Text style={s.amount}>{showBalance ? `${symbol}${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}</Text>
        <Text style={s.caption}>Available balance</Text>
        <View style={s.orb} />
      </LinearGradient>
    </Pressable>
  );
}

const s = StyleSheet.create({
  outer: { width: 272, borderRadius: 20 }, selected: { transform: [{ scale: 1.015 }] },
  card: { minHeight: 178, borderRadius: 20, padding: 17, justifyContent: "space-between", overflow: "hidden" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  label: { color: "#ffffffcc", fontSize: 11, fontWeight: "600" }, currency: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 3 },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 20, backgroundColor: "#ffffff2d", paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "800" }, status: { color: "#fff", fontSize: 10, opacity: 0.9 },
  amount: { color: "#fff", fontSize: 23, fontWeight: "800", marginTop: 10 }, caption: { color: "#ffffffb5", fontSize: 10 },
  orb: { position: "absolute", right: -46, bottom: -100, width: 180, height: 180, borderWidth: 1, borderColor: "#ffffff50", borderRadius: 100 },
});
