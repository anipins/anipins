package com.anipins.app;

import android.app.Activity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class ApiClient {
    interface Callback { void complete(int status, JSONObject data, Exception error); }
    private static final ExecutorService EXECUTOR = Executors.newFixedThreadPool(4);
    private final Activity activity;
    private final SessionVault session;

    ApiClient(Activity activity) { this.activity = activity; this.session = new SessionVault(activity); }
    SessionVault session() { return session; }
    void get(String path, Callback callback) { request("GET", path, null, callback); }
    void post(String path, JSONObject body, Callback callback) { request("POST", path, body, callback); }
    void delete(String path, JSONObject body, Callback callback) { request("DELETE", path, body, callback); }

    private void request(String method, String path, JSONObject body, Callback callback) {
        EXECUTOR.execute(() -> {
            HttpURLConnection connection = null; int status = 0; JSONObject result = new JSONObject(); Exception failure = null;
            try {
                connection = (HttpURLConnection) new URL(BuildConfig.API_BASE_URL + path).openConnection();
                connection.setRequestMethod(method); connection.setConnectTimeout(12000); connection.setReadTimeout(20000);
                connection.setRequestProperty("Accept", "application/json"); connection.setRequestProperty("User-Agent", "AniPins-Android/" + BuildConfig.VERSION_NAME);
                String cookie = session.read(); if (!cookie.isEmpty()) connection.setRequestProperty("Cookie", cookie);
                if (body != null) { connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json"); try (OutputStream output = connection.getOutputStream()) { output.write(body.toString().getBytes(StandardCharsets.UTF_8)); } }
                status = connection.getResponseCode();
                String setCookie = connection.getHeaderField("Set-Cookie");
                if (setCookie != null && setCookie.startsWith("anipins_session=")) session.save(setCookie.split(";", 2)[0]);
                if (status == 401) session.clear();
                InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                StringBuilder json = new StringBuilder(); if (stream != null) try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) { String line; while ((line = reader.readLine()) != null) json.append(line); }
                if (json.length() > 0) result = new JSONObject(json.toString());
            } catch (Exception error) { failure = error; }
            finally { if (connection != null) connection.disconnect(); }
            int finalStatus = status; JSONObject finalResult = result; Exception finalFailure = failure;
            activity.runOnUiThread(() -> callback.complete(finalStatus, finalResult, finalFailure));
        });
    }
}
