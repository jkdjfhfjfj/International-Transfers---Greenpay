import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

const tabPresentation: Record<string, { label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = {
  index: { label: "Home", icon: "home" },
  card: { label: "Card", icon: "credit-card" },
  send: { label: "Send", icon: "send" },
  activity: { label: "History", icon: "clipboard" },
  settings: { label: "Settings", icon: "settings" },
};

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  return (
    <View pointerEvents="box-none" style={[styles.position, { bottom: Math.max(insets.bottom, 8) + 12 }]}>
      <View accessibilityRole="tablist" style={[styles.dock, {
        backgroundColor: scheme === "dark" ? "rgba(17,24,39,0.96)" : "rgba(255,255,255,0.96)",
        borderColor: theme.border,
      }]}>
        {state.routes.map((route: any, index: number) => {
          const presentation = tabPresentation[route.name];
          if (!presentation || descriptors[route.key]?.options?.href === null) return null;
          const focused = state.index === index;
          const center = route.name === "send";
          const color = focused ? theme.primary : theme.mutedForeground;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${presentation.label} tab`}
              onPress={onPress}
              style={[styles.item, center && styles.centerItem]}
            >
              {center ? (
                <View style={[styles.centerButton, { backgroundColor: theme.primary, borderColor: theme.background }]}><Feather name={presentation.icon} size={22} color="#fff" /></View>
              ) : <Feather name={presentation.icon} size={20} color={color} />}
              <Text style={[styles.label, { color }]}>{presentation.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: "absolute", left: 12, right: 12, zIndex: 50 },
  dock: {
    height: 72, borderRadius: 36, borderWidth: 1, flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-around", paddingHorizontal: 7, paddingBottom: 8,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18,
    shadowRadius: 18, elevation: 12,
  },
  item: { position: "relative", flex: 1, height: 72, alignItems: "center", justifyContent: "flex-end", gap: 4, paddingBottom: 8 },
  centerItem: { justifyContent: "flex-end" },
  centerButton: {
    position: "absolute", top: -26, width: 52, height: 52, borderRadius: 26, borderWidth: 3,
    alignItems: "center", justifyContent: "center", elevation: 5,
  },
  label: { fontSize: 10, fontWeight: "600", lineHeight: 12 },
});
