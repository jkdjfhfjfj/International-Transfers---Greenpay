---
name: GreenPay native UI parity
description: User's requirement for implementing the GreenPay mobile app from the existing web product.
---

For GreenPay mobile, preserve native onboarding and sign-in, then rebuild feature screens as native UI using the existing GreenPay web screens and components as the source for layout and behavior, with the same API. Do not replace the feature app with a WebView.

**Why:** The user repeatedly clarified that a WebView is not the requested native rebuild and that the existing TSX views/components should be reused.

**How to apply:** Existing browser TSX with DOM/shadcn dependencies cannot render directly on iOS/Android. Port its structure, actions, contracts, and visual tokens into React Native components instead of inventing unrelated UI.

Native biometric app unlock and account passkeys are separate security flows. Device-local authentication can unlock an already signed-in app, but it cannot replace the server-verified WebAuthn assertion required for account sign-in.

**Why:** The account passkey flow is verified by the backend; a local Face ID or fingerprint prompt alone does not prove account identity to the server.

**How to apply:** Use native local authentication for device app-lock behavior. Keep account passkeys on the secure WebAuthn handoff unless a native implementation sends a valid server-verifiable assertion.
