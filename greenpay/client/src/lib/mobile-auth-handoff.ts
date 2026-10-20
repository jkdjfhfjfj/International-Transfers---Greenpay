const MOBILE_AUTH_RETURN_KEY = "geepay-mobile-auth-return";

export function rememberMobileAuthReturn() {
  if (typeof window === "undefined") return;
  if (new URLSearchParams(window.location.search).get("source") === "mobile") {
    window.sessionStorage.setItem(MOBILE_AUTH_RETURN_KEY, "1");
  }
}

export async function returnToMobileAppAfterAuth(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const requested =
    new URLSearchParams(window.location.search).get("source") === "mobile" ||
    window.sessionStorage.getItem(MOBILE_AUTH_RETURN_KEY) === "1";
  if (!requested) return false;

  const response = await fetch("/api/auth/mobile/callback-code", {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.code !== "string") {
    throw new Error(data.message || "Could not return to the mobile app. Please try again.");
  }
  window.sessionStorage.removeItem(MOBILE_AUTH_RETURN_KEY);
  window.location.assign(`greenpay-mobile://auth/callback?code=${encodeURIComponent(data.code)}`);
  return true;
}
