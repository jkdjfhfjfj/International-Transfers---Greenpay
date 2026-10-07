# GreenPay Mobile ProGuard Rules

# Capacitor
-keep public class com.capacitorjs.** { public *; }
-keep public class * extends com.capacitorjs.** { public *; }
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-keep interface com.google.android.gms.** { *; }
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# OkHttp & Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }
-keep interface okhttp3.** { *; }
-keep interface retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# JSON & GSON
-dontwarn com.google.gson.**
-keep class com.google.gson.** { *; }
-keep interface com.google.gson.** { *; }
-keepattributes *Annotation*

# GreenPay App
-keep class com.greenpay.** { *; }
-keep interface com.greenpay.** { *; }
-keepclassmembers class com.greenpay.** { public <init>(...); public <methods>; }

# Android Framework
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.app.Fragment
-keep public class * extends android.app.Application { public <init>(...); public void onCreate(); }

# Native methods
-keepclasseswithmembernames class * { native <methods>; }

# Enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Debugging
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable
