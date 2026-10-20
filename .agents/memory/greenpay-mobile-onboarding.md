---
name: GreenPay mobile onboarding
description: Product requirements for the mobile app’s public start, signup, and external verification flows.
---

Start unauthenticated mobile users on public getting-started content, not a sign-in or sign-up form. Include a clear skip path to sign-in and make account creation available after the initial content. Match the web app’s Geepay branding.

Show the getting-started pages only once per install. Mobile signup stays native: verify the email with a one-time code first, then collect the remaining account details in steps; do not redirect signup to a browser.

Deposits, virtual-card purchases, and KYC may complete in a browser and should return users to the app with refreshed status. For browser sign-in, use the approved short-lived, single-use app-code exchange; never transfer browser cookies or long-lived credentials in a URL. Confirm provider support before adding payment deep links.

Use the existing Geepay app icon on onboarding and sign-in. Keep Android status/navigation bars aligned with the active screen theme, and show available OTP, PIN, authenticator, and passkey challenges instead of hiding them.

**Why:** the user specified public onboarding, native email-first signup, browser completion for regulated identity/payment flows, secure app callbacks, and visible mobile verification prompts.

**How to apply:** preserve one-time onboarding and native signup when changing mobile routing or authentication; preserve browser-return behavior for KYC and payments.
