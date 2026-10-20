# GreenPay Mobile — Google Play release checklist

This app is configured to target Android 16 / API 36 and requests no runtime permissions. This is a technical baseline, not a guarantee of Play approval.

Before submitting:

- Complete Play Console’s **Financial features declaration** accurately. GreenPay manages financial accounts, so the financial-services policy applies even though this mobile MVP is read-only.
- Confirm the publisher and GreenPay entity are authorized for every country where the listing is available. Do not enable crypto exchange, wallet, custody, or payment features in a region without the required local approvals.
- Publish a public privacy policy that describes account, transaction, device, and support data handling; complete the Data safety form consistently with actual production behavior.
- Provide Play review with a working account and clear instructions for any sign-in verification required for review.
- Confirm the store listing, screenshots, feature claims, support contact, and financial-risk disclosures match the released app.
- Verify any account creation and deletion requirements against the production account-deletion flow before publishing.
- Generate and test a signed Android App Bundle, run Play pre-launch checks, and confirm the final built artifact still targets API 36.

Official references:

- [Financial Services policy](https://support.google.com/googleplay/android-developer/answer/9876821)
- [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)

Replit's Expo publishing flow does not currently submit Android apps to Google Play. This artifact provides the Expo preview and Android project configuration; Play Console upload and legal/publisher declarations remain the publisher's responsibility.
