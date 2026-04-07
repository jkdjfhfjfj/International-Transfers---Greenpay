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
        android.util.Log.d("GreenPayFCM", "FCM Token refreshed");
    }

    private void sendNotification(String title, String body, String type) {
        try {
            NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

            if (notificationManager == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("GreenPay financial notifications");
                channel.enableVibration(true);
                channel.enableLights(true);
                notificationManager.createNotificationChannel(channel);
            }

            NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setVibrate(new long[]{0, 250, 250, 250})
                    .setColor(0xFF2E7D32);

            notificationManager.notify(
                (int) System.currentTimeMillis(),
                notificationBuilder.build()
            );
        } catch (Exception e) {
            android.util.Log.e("GreenPayFCM", "Error sending notification", e);
        }
    }
}
