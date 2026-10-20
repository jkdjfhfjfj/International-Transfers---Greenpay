---
name: Android build storage
description: Persistent storage locations and Java flags for Android SDK/Gradle builds in this workspace.
---

Keep the Android SDK, Gradle user home, and temporary build directory under the workspace's ignored `.local` directory, not `/tmp`.

**Why:** A workspace restart cleared an SDK installed under `/tmp` and terminated an in-progress Gradle build.

**How to apply:** Set `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `GRADLE_USER_HOME`, `TMPDIR`, and Java's `java.io.tmpdir` to workspace `.local` paths before Android builds. Use Java 17 with `-XX:-UsePerfData` for Android SDK command-line tools in this environment.

For phone release APKs in this constrained workspace, target `armeabi-v7a,arm64-v8a` and limit both Gradle and CMake parallelism to one worker. Avoid x86/x86_64 unless emulator support is needed; those ABIs make native release builds significantly slower and more memory-intensive.

**Why:** A first all-ABI release build spent over 15 minutes in emulator-ABI native compilation. A two-worker ARM build later lost its Gradle daemon during 32-bit native compilation; setting one Gradle worker and `CMAKE_BUILD_PARALLEL_LEVEL=1` allowed the ARM build to complete.

**How to apply:** Pass `-PreactNativeArchitectures=armeabi-v7a,arm64-v8a --max-workers=1` and set `CMAKE_BUILD_PARALLEL_LEVEL=1` for phone APK builds, without changing the project's default architecture list.
