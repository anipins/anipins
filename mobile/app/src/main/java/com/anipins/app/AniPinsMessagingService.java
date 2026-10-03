package com.anipins.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class AniPinsMessagingService extends FirebaseMessagingService {
    static final String CHANNEL_ID = "anipins_updates";
    private static final String HOME_URL = "https://anipins.com/";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        getSharedPreferences("anipins_push", MODE_PRIVATE).edit().putString("token", token).apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);
        String path = message.getData().get("path");
        String title = message.getData().get("title");
        String body = message.getData().get("body");
        showNotification(title == null || title.isEmpty() ? "AniPins" : title, body == null ? "" : body, path);
    }

    private void showNotification(String title, String body, String path) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "AniPins updates", NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("New artwork and account updates from AniPins");
            manager.createNotificationChannel(channel);
        }

        String target = path == null || path.trim().isEmpty() ? HOME_URL : HOME_URL + path.replaceFirst("^/", "");
        Intent open = new Intent(this, MainActivity.class).setData(android.net.Uri.parse(target));
        open.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, target.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));

        android.app.Notification.Builder notification = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new android.app.Notification.Builder(this, CHANNEL_ID)
            : new android.app.Notification.Builder(this);
        notification.setSmallIcon(R.drawable.ic_stat_ap)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new android.app.Notification.BigTextStyle().bigText(body))
            .setContentIntent(pending)
            .setAutoCancel(true);
        try { manager.notify(target.hashCode(), notification.build()); } catch (SecurityException ignored) {}
    }
}
