---
name: GreenPay native UI parity
description: User's requirement for implementing the GreenPay mobile app from the existing web product.
---

For GreenPay mobile, preserve native onboarding and sign-in, then rebuild feature screens as native UI using the existing GreenPay web screens and components as the source for layout and behavior, with the same API. Do not replace the feature app with a WebView.

**Why:** The user repeatedly clarified that a WebView is not the requested native rebuild and that the existing TSX views/components should be reused.

**How to apply:** Existing browser TSX with DOM/shadcn dependencies cannot render directly on iOS/Android. Port its structure, actions, contracts, and visual tokens into React Native components instead of inventing unrelated UI.
