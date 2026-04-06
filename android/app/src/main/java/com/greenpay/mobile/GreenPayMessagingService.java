package com.greenpay.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import androidx.core.app.NotificationCompat;

/**
 * Firebase Cloud Messaging Service for GreenPay
 * Handles incoming push notifications
 */
public class GreenPayMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "greenpay_notifications";
    private static final String CHANNEL_NAME = "GreenPay Notifications";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        // Get notification data
        String title = remoteMessage.getNotification() != null 
            ? remoteMessage.getNotification().getTitle() 
            : "GreenPay";
        String body = remoteMessage.getNotification() != null 
            ? remoteMessage.getNotification().getBody() 
            : "New notification";
        String notificationType = remoteMessage.getData().get("type");

        // Create and display notification
        sendNotification(title, body, notificationType);
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        
        // Send token to backend for registration
        // This is handled by Capacitor's PushNotifications plugin
        sendTokenToBackend(token);
    }

    /**
     * Send notification to user
     */
    private void sendNotification(String title, String body, String type) {
        NotificationManager notificationManager = 
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Create notification channel for Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("GreenPay financial notifications");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setSound(
                android.net.Uri.parse("android.resource://" + getPackageName() + "/raw/notification"),
                new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                    .build()
            );
            notificationManager.createNotificationChannel(channel);
        }

        // Build notification
        NotificationCompat.Builder notificationBuilder = 
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVibrate(new long[]{0, 250, 250, 250});

        // Set icon based on notification type
        int iconRes = getNotificationIcon(type);
        if (iconRes > 0) {
            notificationBuilder.setSmallIcon(iconRes);
        }

        // Set color for notification
        notificationBuilder.setColor(getResources().getColor(android.R.color.holo_green_dark));

        // Display notification
        notificationManager.notify(
            (int) System.currentTimeMillis(),
            notificationBuilder.build()
        );
    }

    /**
     * Get notification icon based on type
     */
    private int getNotificationIcon(String type) {
        if (type == null) return 0;
        
        switch (type) {
            case "kyc":
                return android.R.drawable.ic_dialog_info;
            case "transaction":
                return android.R.drawable.ic_dialog_email;
            case "withdrawal":
                return android.R.drawable.ic_menu_send;
            case "payment":
                return android.R.drawable.ic_dialog_map;
            default:
                return android.R.drawable.ic_dialog_info;
        }
    }

    /**
     * Send FCM token to backend for registration
     */
    private void sendTokenToBackend(String token) {
        // Token is handled by Capacitor's PushNotifications plugin
        // It automatically registers with the app's event system
        android.util.Log.d("GreenPayFCM", "FCM Token: " + token);
    }
}
