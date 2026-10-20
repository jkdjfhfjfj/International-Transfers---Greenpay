---
name: Android build storage
description: Persistent storage locations and Java flags for Android SDK/Gradle builds in this workspace.
---

Keep the Android SDK, Gradle user home, and temporary build directory under the workspace's ignored `.local` directory, not `/tmp`.

**Why:** A workspace restart cleared an SDK installed under `/tmp` and terminated an in-progress Gradle build.

**How to apply:** Set `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `GRADLE_USER_HOME`, `TMPDIR`, and Java's `java.io.tmpdir` to workspace `.local` paths before Android builds. Use Java 17 with `-XX:-UsePerfData` for Android SDK command-line tools in this environment.
