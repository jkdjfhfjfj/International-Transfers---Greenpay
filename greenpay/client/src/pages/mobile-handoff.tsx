import { useEffect, useState } from "react";

export default function MobileHandoffPage() {
  const [message, setMessage] = useState("Opening your secure GreenPay session…");

  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get("code");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);

    if (!code) {
      setMessage("This sign-in link is missing or expired. Return to the mobile app and try again.");
      return;
    }

    let active = true;
    fetch("/api/auth/mobile/exchange", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user) {
          throw new Error(typeof data.message === "string" ? data.message : "Could not open your GreenPay session.");
        }
        window.location.replace("/dashboard");
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Could not open your GreenPay session.");
        }
      });

    return () => { active = false; };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground" role="status">{message}</p>
      </div>
    </main>
  );
}
