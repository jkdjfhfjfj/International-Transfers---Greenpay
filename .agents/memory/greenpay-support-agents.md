---
name: GreenPay support agents
description: Authenticated agent availability, selection, and heartbeat expiry for GreenPay support.
---

Use active admin accounts as the support-agent roster unless GreenPay adds dedicated support roles. Presence must be written through an authenticated admin endpoint; never infer it from a client-supplied WebSocket `isAdmin` claim. An agent is online only while their server-recorded heartbeat is fresh; stale heartbeats are offline.

**Why:** the prior WebSocket registration accepted client-supplied admin identity, which is not a trustworthy source for customer-facing availability or assignment.

**How to apply:** preserve authenticated presence checks when changing support staffing, availability indicators, assignment, or transfer notifications.
