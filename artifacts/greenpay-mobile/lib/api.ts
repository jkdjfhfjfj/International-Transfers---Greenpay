const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain
  ? `${domain.startsWith("http") ? "" : "https://"}${domain}`
  : "";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) throw new Error("GreenPay server is not configured for this build.");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "GreenPay could not complete that request.");
  }
  return data as T;
}
