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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
                connection.setRequestProperty("Origin", BuildConfig.API_BASE_URL);
                String cookie = session.read(); if (!cookie.isEmpty()) connection.setRequestProperty("Cookie", cookie);
                if (body != null) { connection.setDoOutput(true); connection.setRequestProperty("Content-Type", "application/json"); try (OutputStream output = connection.getOutputStream()) { output.write(body.toString().getBytes(StandardCharsets.UTF_8)); } }
                status = connection.getResponseCode();
                List<String> setCookies = null;
                for (Map.Entry<String, List<String>> header : connection.getHeaderFields().entrySet()) {
                    if (header.getKey() != null && header.getKey().equalsIgnoreCase("Set-Cookie")) {
                        setCookies = header.getValue();
                        break;
                    }
                }
                if (setCookies != null) updateSessionCookies(setCookies);
                if (status == 401 && "/api/auth/me".equals(path)) session.clear();
                InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                StringBuilder json = new StringBuilder(); if (stream != null) try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) { String line; while ((line = reader.readLine()) != null) json.append(line); }
                if (json.length() > 0) result = new JSONObject(json.toString());
            } catch (Exception error) { failure = error; }
            finally { if (connection != null) connection.disconnect(); }
            int finalStatus = status; JSONObject finalResult = result; Exception finalFailure = failure;
            activity.runOnUiThread(() -> callback.complete(finalStatus, finalResult, finalFailure));
        });
    }

    private void updateSessionCookies(List<String> setCookies) {
        Map<String, String> cookies = new LinkedHashMap<>();
        String existing = session.read();
        for (String item : existing.split(";")) {
            String cookie = item.trim(); int separator = cookie.indexOf('=');
            if (separator > 0) cookies.put(cookie.substring(0, separator), cookie.substring(separator + 1));
        }
        for (String header : setCookies) {
            if (header == null) continue;
            String pair = header.split(";", 2)[0].trim(); int separator = pair.indexOf('=');
            if (separator <= 0) continue;
            String name = pair.substring(0, separator), value = pair.substring(separator + 1);
            if (!name.equals("anipins_session") && !name.equals("anipins_better_auth")
                && !name.equals("anipins_admin_mfa") && !name.equals("anipins_admin_mfa_setup")
                && !name.equals("anipins_google_nonce")) continue;
            if (header.toLowerCase(java.util.Locale.ROOT).contains("max-age=0") || value.isEmpty()) cookies.remove(name);
            else cookies.put(name, value);
        }
        StringBuilder result = new StringBuilder();
        for (Map.Entry<String, String> entry : cookies.entrySet()) {
            if (result.length() > 0) result.append("; ");
            result.append(entry.getKey()).append('=').append(entry.getValue());
        }
        if (result.length() == 0) session.clear(); else session.save(result.toString());
    }
}
