package com.anipins.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.URLUtil;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Button;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONException;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.concurrent.Executor;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://anipins.com/";
    private static final String HOST = "anipins.com";
    private static final String USER_AGENT_SUFFIX = " AniPinsAndroid/" + BuildConfig.VERSION_NAME;
    private static final int FILE_PICKER_REQUEST = 4101;
    private static final int STORAGE_PERMISSION_REQUEST = 4102;
    private static final String NOTIFICATION_CHANNEL = "anipins_updates";

    private WebView webView;
    private ProgressBar progress;
    private View errorPanel;
    private ApiClient api;
    private CredentialManager credentialManager;
    private ValueCallback<Uri[]> pendingFileCallback;
    private boolean nativeGoogleBusy;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.rgb(8, 8, 8));
        getWindow().setNavigationBarColor(Color.rgb(8, 8, 8));

        api = new ApiClient(this);
        credentialManager = CredentialManager.create(this);
        setContentView(buildShell());
        configureWebView();

        if (state == null) {
            String launchUrl = getDeepLink(getIntent());
            loadUrl(launchUrl == null ? HOME_URL : launchUrl);
        } else {
            webView.restoreState(state);
        }

        checkForNotifications();
        checkForUpdate();
    }

    private View buildShell() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 8, 8));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8, 8, 8));
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setVisibility(View.GONE);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(-1, Ui.dp(this, 2));
        progressParams.topMargin = 0;
        root.addView(progress, progressParams);

        errorPanel = buildErrorPanel();
        errorPanel.setVisibility(View.GONE);
        root.addView(errorPanel, new FrameLayout.LayoutParams(-1, -1));

        return root;
    }

    private View buildErrorPanel() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(android.view.Gravity.CENTER);
        panel.setPadding(Ui.dp(this, 28), Ui.dp(this, 28), Ui.dp(this, 28), Ui.dp(this, 28));
        panel.setBackgroundColor(Color.rgb(8, 8, 8));

        TextView logo = Ui.text(this, "AniPins", 30, Ui.PAPER, true);
        panel.addView(logo);

        TextView message = Ui.text(this, "We could not load AniPins right now.", 15, Ui.FOG, false);
        message.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(-2, -2);
        mp.setMargins(0, Ui.dp(this, 10), 0, 0);
        panel.addView(message, mp);

        Button retry = new Button(this);
        retry.setText("Try again");
        retry.setAllCaps(false);
        retry.setTextColor(Ui.INK);
        retry.setTextSize(14);
        retry.setBackground(Ui.background(Ui.GOLD, Ui.dp(this, 24), Ui.GOLD));
        LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(Ui.dp(this, 150), Ui.dp(this, 50));
        rp.setMargins(0, Ui.dp(this, 20), 0, 0);
        panel.addView(retry, rp);
        retry.setOnClickListener(v -> loadUrl(webView.getUrl() == null ? HOME_URL : webView.getUrl()));
        return panel;
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        settings.setTextZoom(100);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= 21) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        settings.setUserAgentString(settings.getUserAgentString() + USER_AGENT_SUFFIX);

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= 21) cookies.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new NativeBridge(), "AniPinsAndroid");
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
                super.onProgressChanged(view, newProgress);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
                pendingFileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    startActivityForResult(intent, FILE_PICKER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException e) {
                    pendingFileCallback = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                return routeUri(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUri(Uri.parse(url));
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                errorPanel.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                errorPanel.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                if (Build.VERSION.SDK_INT >= 21) CookieManager.getInstance().flush();
                super.onPageFinished(view, url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showLoadError();
                super.onReceivedError(view, request, error);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showLoadError();
                super.onReceivedError(view, errorCode, description, failingUrl);
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                enqueueDownload(url, userAgent, contentDisposition, mimetype);
            }
        });
    }

    private boolean routeUri(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        if ((scheme.equals("https") || scheme.equals("http")) && ("instagram.com".equals(host) || "www.instagram.com".equals(host))) { openInstagramFromNative(); return true; }
        if ((scheme.equals("https") || scheme.equals("http")) && (HOST.equals(host) || ("www." + HOST).equals(host))) {
            return false;
        }

        try {
            if (scheme.equals("http") || scheme.equals("https") || scheme.equals("mailto") || scheme.equals("tel") || scheme.equals("geo")) {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } else {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
            }
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app can open this link.", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    private void enqueueDownload(String url, String userAgent, String contentDisposition, String mimetype) {
        if (Build.VERSION.SDK_INT < 29 && ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            pendingDownloadUrl = url;
            pendingDownloadUserAgent = userAgent;
            pendingDownloadContentDisposition = contentDisposition;
            pendingDownloadMimeType = mimetype;
            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, STORAGE_PERMISSION_REQUEST);
            return;
        }

        String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(fileName);
        request.setDescription("Downloading from AniPins");
        request.setMimeType(mimetype == null || mimetype.isEmpty() ? "application/octet-stream" : mimetype);
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);

        String cookie = CookieManager.getInstance().getCookie(url);
        if (cookie != null && !cookie.isEmpty()) request.addRequestHeader("Cookie", cookie);
        if (userAgent != null && !userAgent.isEmpty()) request.addRequestHeader("User-Agent", userAgent);

        try {
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (ActivityNotFoundException ignored) {
                Toast.makeText(this, "Could not start download.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private String pendingDownloadUrl;
    private String pendingDownloadUserAgent;
    private String pendingDownloadContentDisposition;
    private String pendingDownloadMimeType;

    private void showLoadError() {
        webView.setVisibility(View.GONE);
        errorPanel.setVisibility(View.VISIBLE);
        progress.setVisibility(View.GONE);
    }

    private void loadUrl(String url) {
        errorPanel.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private String getDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) return null;
        Uri uri = intent.getData();
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        return ("https".equals(scheme) && (HOST.equals(host) || ("www." + HOST).equals(host))) ? uri.toString() : null;
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String url = getDeepLink(intent);
        if (url != null) loadUrl(url);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_PICKER_REQUEST) {
            if (pendingFileCallback != null) {
                Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                pendingFileCallback.onReceiveValue(results);
                pendingFileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == STORAGE_PERMISSION_REQUEST && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && pendingDownloadUrl != null) {
            String url = pendingDownloadUrl;
            String ua = pendingDownloadUserAgent;
            String cd = pendingDownloadContentDisposition;
            String mt = pendingDownloadMimeType;
            pendingDownloadUrl = pendingDownloadUserAgent = pendingDownloadContentDisposition = pendingDownloadMimeType = null;
            enqueueDownload(url, ua, cd, mt);
        }
    }

    private void beginGoogleSignIn(final String nonce) {
        if (nativeGoogleBusy) return;
        if (nonce == null || nonce.trim().isEmpty()) {
            dispatchGoogleError("Google sign-in could not start. Please try again.");
            return;
        }

        nativeGoogleBusy = true;
        api.get("/api/auth/google/native-config", (status, data, error) -> {
            if (status != 200 || error != null || data.optString("clientId").isEmpty()) {
                nativeGoogleBusy = false;
                dispatchGoogleError("Google sign-in is not configured.");
                return;
            }
            requestGoogleCredential(data.optString("clientId"), nonce, false);
        });
    }

    private void requestGoogleCredential(final String serverClientId, final String nonce, final boolean fallback) {
        GetGoogleIdOption option = new GetGoogleIdOption.Builder()
            .setServerClientId(serverClientId)
            .setNonce(nonce)
            .setFilterByAuthorizedAccounts(!fallback)
            .setAutoSelectEnabled(false)
            .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(option)
            .build();

        Executor executor = command -> runOnUiThread(command);
        credentialManager.getCredentialAsync(this, request, null, executor, new CredentialManagerCallback<GetCredentialResponse, androidx.credentials.exceptions.GetCredentialException>() {
            @Override
            public void onResult(GetCredentialResponse response) {
                nativeGoogleBusy = false;
                Credential credential = response.getCredential();
                if (!(credential instanceof CustomCredential)) {
                    dispatchGoogleError("Google returned an unsupported credential.");
                    return;
                }

                CustomCredential custom = (CustomCredential) credential;
                if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(custom.getType())) {
                    dispatchGoogleError("Google returned an unsupported credential.");
                    return;
                }

                try {
                    GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(custom.getData());
                    dispatchGoogleCredential(googleCredential.getIdToken());
                } catch (Exception e) {
                    dispatchGoogleError("Could not read the Google credential.");
                }
            }

            @Override
            public void onError(androidx.credentials.exceptions.GetCredentialException e) {
                String detail = e.getMessage();
                if (detail == null || detail.trim().isEmpty()) detail = e.getClass().getSimpleName();
                String lower = detail.toLowerCase(java.util.Locale.ROOT);

                if (!fallback && (lower.contains("account reauth failed") || lower.contains("[16]") || e.getClass().getSimpleName().contains("Cancellation"))) {
                    requestGoogleCredential(serverClientId, nonce, true);
                    return;
                }

                nativeGoogleBusy = false;
                if (lower.contains("account reauth failed") || lower.contains("[16]")) {
                    dispatchGoogleError("Google sign-in could not verify this Android app configuration. Check the Android OAuth client package name and SHA-1 certificate.");
                } else {
                    dispatchGoogleError("Google sign-in failed: " + detail);
                }
            }
        });
    }

        private void dispatchGoogleCredential(String token) {
        if (webView == null) return;
        String quoted = JSONObject.quote(token);
        webView.post(() -> webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('anipins-native-google-credential',{detail:{credential:" + quoted + "}}));",
            null
        ));
    }

    private void dispatchGoogleError(String message) {
        if (webView == null) return;
        String quoted = JSONObject.quote(message);
        webView.post(() -> webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('anipins-native-google-error',{detail:{message:" + quoted + "}}));",
            null
        ));
    }

    private void checkForNotifications() {
        api.get("/api/notifications?unread=1&limit=1", (status, data, error) -> {
            if (status != 200 || error != null || data.optInt("unread", 0) <= 0) return;
            JSONArrayHolder holder = new JSONArrayHolder(data);
            int artworkId = holder.artworkId;
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationManager manager = getSystemService(NotificationManager.class);
                manager.createNotificationChannel(new NotificationChannel(NOTIFICATION_CHANNEL, "AniPins updates", NotificationManager.IMPORTANCE_DEFAULT));
            }
            Intent tap = new Intent(this, MainActivity.class);
            if (artworkId > 0) tap.setData(Uri.parse(HOME_URL + "a/" + artworkId));
            tap.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending = PendingIntent.getActivity(
                this,
                artworkId,
                tap,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
            );
            android.app.Notification.Builder notification = Build.VERSION.SDK_INT >= 26
                ? new android.app.Notification.Builder(this, NOTIFICATION_CHANNEL)
                : new android.app.Notification.Builder(this);
            notification.setSmallIcon(R.drawable.ap_symbol)
                .setContentTitle("AniPins")
                .setContentText(data.optInt("unread", 1) + " new notification" + (data.optInt("unread", 1) == 1 ? "" : "s"))
                .setContentIntent(pending)
                .setAutoCancel(true);
            try {
                getSystemService(NotificationManager.class).notify(1001, notification.build());
            } catch (SecurityException ignored) {}
        });
    }

    private void checkForUpdate() {
        api.get("/api/app-version", (status, data, error) -> {
            if (status != 200 || error != null || data.optInt("versionCode") <= BuildConfig.VERSION_CODE) return;
            String apk = data.optString("apk", "/downloads/AniPins.apk");
            new android.app.AlertDialog.Builder(this)
                .setTitle("AniPins update available")
                .setMessage("A newer AniPins app is ready.")
                .setNegativeButton("Later", null)
                .setPositiveButton("Update", (dialog, which) -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(apk.startsWith("http") ? apk : HOME_URL + apk.replaceFirst("^/", "")))))
                .show();
        });
    }

    private final class NativeBridge {
        @JavascriptInterface
        public void signInWithGoogle(String nonce) {
            runOnUiThread(() -> beginGoogleSignIn(nonce));
        }

        @JavascriptInterface
        public int getVersionCode() {
            return BuildConfig.VERSION_CODE;
        }

        @JavascriptInterface
        public void openInstagram() { openInstagramFromNative(); }

    private void openInstagramFromNative() {
            try {
                Intent instagram = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com/_anipinss_/"));
                instagram.setPackage("com.instagram.android");
                startActivity(instagram);
            } catch (ActivityNotFoundException e) {
                try {
                    Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.instagram.com/_anipinss_/"));
                    startActivity(browser);
                } catch (ActivityNotFoundException ignored) {
                    Toast.makeText(MainActivity.this, "Instagram could not be opened.", Toast.LENGTH_LONG).show();
                }
            }
        }

        @JavascriptInterface
        public void openDownloads() {
            try {
                startActivity(new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS));
            } catch (ActivityNotFoundException e) {
                try {
                    startActivity(new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS));
                } catch (ActivityNotFoundException ignored) {}
            }
        }
    }

    private static final class JSONArrayHolder {
        final int artworkId;
        JSONArrayHolder(JSONObject data) {
            int value = 0;
            try {
                org.json.JSONArray items = data.optJSONArray("notifications");
                if (items != null && items.length() > 0 && items.optJSONObject(0) != null) value = items.optJSONObject(0).optInt("artwork_id", 0);
            } catch (Exception ignored) {}
            artworkId = value;
        }
}
}
