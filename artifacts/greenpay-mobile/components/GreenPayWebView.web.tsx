import { useCallback } from "react";
import { createElement } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  sourceUri: string;
  onSignOut: () => void;
  onError: () => void;
};

export function GreenPayWebView({ sourceUri, onSignOut, onError }: Props) {
  const handleLoad = useCallback((event: any) => {
    try {
      const url = new URL(event.currentTarget.contentWindow.location.href);
      if (/\/login(?:\/|$)/.test(url.pathname)) onSignOut();
    } catch {
      // The web preview may run on a different host; native WebView handles auth navigation.
    }
  }, [onSignOut]);
  return (
    <View style={styles.container}>
      {createElement("iframe" as any, {
        src: sourceUri,
        title: "GreenPay",
        onLoad: handleLoad,
        onError,
        style: { width: "100%", height: "100%", border: 0, backgroundColor: "#f8fafc" },
        allow: "clipboard-read; clipboard-write",
      })}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, overflow: "hidden" } });
