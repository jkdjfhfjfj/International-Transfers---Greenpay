---
name: WebAuthn trust boundary
description: Security boundary for biometric login and passkey storage
---

A WebAuthn credential ID must never be treated as proof of possession; the server must issue a one-time challenge and verify the client data, RP hash, authenticator flags, signature, and counter against the stored public key.

**Why:** The browser returns an identifier separately from the signed assertion. Accepting the identifier alone allows anyone who knows it to bypass biometric authentication.

**How to apply:** Keep challenges server-generated and short-lived, fail closed for legacy identifier-only endpoints, and persist the authenticator counter after a valid assertion.