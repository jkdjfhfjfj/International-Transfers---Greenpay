import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

type Props = {
  sourceUri: string;
  onSignOut: () => void;
  onError: () => void;
};

export function GreenPayWebView({ sourceUri, onSignOut, onError }: Props) {
  const handleNavigation = useCallback((state: WebViewNavigation) => {
    if (/\/login(?:[/?#]|$)/.test(state.url)) onSignOut();
  }, [onSignOut]);

  return (
    <WebView
      source={{ uri: sourceUri }}
      style={styles.webview}
      onNavigationStateChange={handleNavigation}
      onError={onError}
      onHttpError={(event) => {
        if (event.nativeEvent.statusCode >= 500) onError();
      }}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      setSupportMultipleWindows={false}
      allowsBackForwardNavigationGestures
    />
  );
}

const styles = StyleSheet.create({ webview: { flex: 1, backgroundColor: "#f8fafc" } });
