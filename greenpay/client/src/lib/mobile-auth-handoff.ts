const MOBILE_AUTH_RETURN_KEY = "geepay-mobile-auth-return";
const MOBILE_AUTH_REDIRECT_KEY = "geepay-mobile-auth-redirect";

function getMobileRedirectUri(value: string | null): string | null {
  if (!value) return null;
  try {
    const uri = new URL(value);
    const isInstalledApp = uri.protocol === "greenpay-mobile:" && uri.hostname === "auth";
    const isReplitExpoGo =
      ["exp:", "exps:"].includes(uri.protocol) &&
      uri.hostname.endsWith(".expo.worf.replit.dev");
    if (!isInstalledApp && !isReplitExpoGo) return null;
    if (!uri.pathname.endsWith("/auth/callback") && uri.pathname !== "/callback") return null;
    return uri.toString();
  } catch {
    return null;
  }
}

export function rememberMobileAuthReturn() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("source") !== "mobile") return;
  window.sessionStorage.setItem(MOBILE_AUTH_RETURN_KEY, "1");
  const redirectUri = getMobileRedirectUri(params.get("mobile_redirect_uri"));
  window.sessionStorage.setItem(MOBILE_AUTH_REDIRECT_KEY, redirectUri || "greenpay-mobile://auth/callback");
}

export async function returnToMobileAppAfterAuth(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const requested =
    new URLSearchParams(window.location.search).get("source") === "mobile" ||
    window.sessionStorage.getItem(MOBILE_AUTH_RETURN_KEY) === "1";
  if (!requested) return false;

  const redirectUri =
    getMobileRedirectUri(new URLSearchParams(window.location.search).get("mobile_redirect_uri")) ||
    getMobileRedirectUri(window.sessionStorage.getItem(MOBILE_AUTH_REDIRECT_KEY)) ||
    "greenpay-mobile://auth/callback";
  const response = await fetch("/api/auth/mobile/callback-code", {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ redirectUri }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.code !== "string") {
    throw new Error(data.message || "Could not return to the mobile app. Please try again.");
  }
  window.sessionStorage.removeItem(MOBILE_AUTH_RETURN_KEY);
  window.sessionStorage.removeItem(MOBILE_AUTH_REDIRECT_KEY);
  const callback = new URL(redirectUri);
  callback.searchParams.set("code", data.code);
  window.location.assign(callback.toString());
  return true;
}
