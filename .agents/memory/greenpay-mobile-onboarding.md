---
name: GreenPay mobile onboarding
description: Product requirements for the mobile app’s public start, signup, and external verification flows.
---

Start unauthenticated mobile users on public getting-started content, not a sign-in or sign-up form. Include a clear skip path to sign-in and make account creation available after the initial content. Match the web app’s Geepay branding.

Deposits, virtual-card purchases, and KYC may complete in a browser and should return users to the app with refreshed status. Do not invent an OAuth, passkey, or payment callback/token exchange; confirm the server’s supported return contract first.

**Why:** the user specified a landing/getting-started first experience and browser completion for regulated identity and payment flows.

**How to apply:** preserve these launch and browser-return behaviors when changing mobile routing, authentication, or payment screens.
