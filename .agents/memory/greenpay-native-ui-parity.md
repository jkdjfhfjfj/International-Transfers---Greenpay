---
name: GreenPay native UI parity
description: User's requirement for implementing the GreenPay mobile app from the existing web product.
---

For GreenPay mobile, keep onboarding and sign-in native, then display the existing GreenPay web app inside a WebView for the authenticated dashboard and feature screens.

**Why:** The user later explicitly changed the mobile requirement and asked for the web app in a WebView after authentication.

**How to apply:** Use a short-lived, single-use server handoff to establish the authenticated web session in the WebView; do not assume native fetch cookies are shared with WKWebView or Android WebView.

Native biometric app unlock and account passkeys are separate security flows. Device-local authentication can unlock an already signed-in app, but it cannot replace the server-verified WebAuthn assertion required for account sign-in.

**Why:** The account passkey flow is verified by the backend; a local Face ID or fingerprint prompt alone does not prove account identity to the server.

**How to apply:** Use native local authentication for device app-lock behavior. Keep account passkeys on the secure WebAuthn handoff unless a native implementation sends a valid server-verifiable assertion.
