import assert from "node:assert/strict";
import { test } from "node:test";
import { rememberMobileAuthReturn, returnToMobileAppAfterAuth } from "../client/src/lib/mobile-auth-handoff";

function installBrowser(search: string) {
  const values = new Map<string, string>();
  let assignedUrl = "";
  const browser = {
    location: { search, assign: (url: string) => { assignedUrl = url; } },
    sessionStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  return { values, get assignedUrl() { return assignedUrl; } };
}

test("mobile auth returns to the Expo Go callback URI captured at login", async () => {
  const previousWindow = (globalThis as any).window;
  const previousFetch = globalThis.fetch;
  try {
    const redirectUri = "exp://test-session.expo.worf.replit.dev/--/auth/callback";
    const browser = installBrowser(`?source=mobile&mobile_redirect_uri=${encodeURIComponent(redirectUri)}`);
    let submittedRedirectUri = "";
    globalThis.fetch = (async (_input, init) => {
      submittedRedirectUri = JSON.parse(String(init?.body)).redirectUri;
      return { ok: true, json: async () => ({ code: "one-time-code" }) };
    }) as typeof fetch;

    rememberMobileAuthReturn();
    assert.equal(await returnToMobileAppAfterAuth(), true);
    assert.equal(submittedRedirectUri, redirectUri);
    const returnedUrl = new URL(browser.assignedUrl);
    assert.equal(returnedUrl.protocol, "exp:");
    assert.equal(returnedUrl.hostname, "test-session.expo.worf.replit.dev");
    assert.equal(returnedUrl.searchParams.get("code"), "one-time-code");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWindow === undefined) delete (globalThis as any).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});

test("mobile auth ignores untrusted deep-link hosts and uses the installed app scheme", async () => {
  const previousWindow = (globalThis as any).window;
  const previousFetch = globalThis.fetch;
  try {
    const browser = installBrowser("?source=mobile&mobile_redirect_uri=exp%3A%2F%2Fevil.example%2F--%2Fauth%2Fcallback");
    let submittedRedirectUri = "";
    globalThis.fetch = (async (_input, init) => {
      submittedRedirectUri = JSON.parse(String(init?.body)).redirectUri;
      return { ok: true, json: async () => ({ code: "one-time-code" }) };
    }) as typeof fetch;

    rememberMobileAuthReturn();
    assert.equal(await returnToMobileAppAfterAuth(), true);
    assert.equal(submittedRedirectUri, "greenpay-mobile://auth/callback");
    const returnedUrl = new URL(browser.assignedUrl);
    assert.equal(returnedUrl.protocol, "greenpay-mobile:");
    assert.equal(returnedUrl.hostname, "auth");
    assert.equal(returnedUrl.searchParams.get("code"), "one-time-code");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWindow === undefined) delete (globalThis as any).window;
    else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
  }
});
