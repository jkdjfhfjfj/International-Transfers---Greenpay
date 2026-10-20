---
name: GreenPay mobile onboarding
description: Product requirements for the mobile app’s public start, signup, and external verification flows.
---

Start unauthenticated mobile users on public getting-started content, not a sign-in or sign-up form. Include a clear skip path to sign-in and make account creation available after the initial content. Match the web app’s Geepay branding.

Deposits, virtual-card purchases, and KYC may complete in a browser and should return users to the app with refreshed status. For browser sign-in, use the approved short-lived, single-use app-code exchange; never transfer browser cookies or long-lived credentials in a URL. Confirm provider support before adding payment deep links.

Use the existing Geepay app icon on onboarding and sign-in. Keep Android status/navigation bars aligned with the active screen theme, and show available OTP, PIN, authenticator, and passkey challenges instead of hiding them.

**Why:** the user specified public onboarding, browser completion for regulated identity/payment flows, secure app callbacks, and visible mobile verification prompts.

**How to apply:** preserve these launch and browser-return behaviors when changing mobile routing, authentication, or payment screens.
