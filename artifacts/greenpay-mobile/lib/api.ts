const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain
  ? `${domain.startsWith("http") ? "" : "https://"}${domain}`
  : "";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!baseUrl) throw new Error("GreenPay server is not configured for this build.");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    let server = baseUrl;
    try { server = new URL(baseUrl).host; } catch {}
    const client = typeof window !== "undefined" ? window.location.origin : "native app";
    throw new Error(`Could not reach GreenPay at ${server} from ${client} for ${path}. ${detail}`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.message === "string" ? data.message : "GreenPay could not complete that request.";
    throw new Error(`${message} (HTTP ${response.status}, ${path})`);
  }
  return data as T;
}
