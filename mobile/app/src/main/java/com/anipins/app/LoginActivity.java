package com.anipins.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.Executor;

public class LoginActivity extends Activity {
    private ApiClient api;
    private boolean register;
    private String challenge = "";
    private TextView heading, copy;
    private EditText name, email, password, code;
    private Button submit, toggle, google;
    private CredentialManager credentialManager;
    private String pendingGoogleNonce = "";

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Ui.INK);
        getWindow().setNavigationBarColor(Ui.INK);
        api = new ApiClient(this);
        credentialManager = CredentialManager.create(this);
        render();
    }

    private void render() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.INK);
        root.setPadding(Ui.dp(this, 22), Ui.dp(this, 26), Ui.dp(this, 22), Ui.dp(this, 24));

        LinearLayout brand = new LinearLayout(this);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        ImageViewHolder logo = new ImageViewHolder(this);
        brand.addView(logo.view, new LinearLayout.LayoutParams(Ui.dp(this, 48), Ui.dp(this, 48)));
        TextView brandText = Ui.text(this, "AniPins", 22, Ui.PAPER, true);
        LinearLayout.LayoutParams bt = new LinearLayout.LayoutParams(0, Ui.dp(this, 48), 1);
        bt.setMargins(Ui.dp(this, 12), 0, 0, 0);
        brand.addView(brandText, bt);
        root.addView(brand);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(Ui.dp(this, 22), Ui.dp(this, 24), Ui.dp(this, 22), Ui.dp(this, 22));
        card.setBackground(Ui.background(Ui.PANEL, Ui.dp(this, 28), Color.rgb(45,45,45)));
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(-1, -2);
        cardParams.setMargins(0, Ui.dp(this, 28), 0, 0);
        root.addView(card, cardParams);

        heading = Ui.text(this, "Welcome back", 27, Ui.PAPER, true);
        card.addView(heading);
        copy = Ui.text(this, "Sign in to your AniPins account.", 14, Ui.FOG, false);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-1, -2);
        cp.setMargins(0, Ui.dp(this, 6), 0, Ui.dp(this, 16));
        card.addView(copy, cp);

        name = input("Name", InputType.TYPE_CLASS_TEXT); card.addView(name, fieldParams()); name.setVisibility(View.GONE);
        email = input("Email address", InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS); card.addView(email, fieldParams());
        password = input("Password", InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD); card.addView(password, fieldParams());
        code = input("Authentication code", InputType.TYPE_CLASS_TEXT); card.addView(code, fieldParams()); code.setVisibility(View.GONE);

        submit = button("Sign in", true);
        submit.setOnClickListener(v -> submitPassword());
        card.addView(submit, actionParams(18));

        google = button("G   Continue with Google", false);
        google.setOnClickListener(v -> beginGoogleSignIn());
        card.addView(google, actionParams(12));

        TextView divider = Ui.text(this, "OR", 11, Ui.FOG, true);
        divider.setGravity(Gravity.CENTER);
        card.addView(divider, new LinearLayout.LayoutParams(-1, Ui.dp(this, 30)));

        toggle = button("New here? Create an account", false);
        toggle.setBackgroundColor(Color.TRANSPARENT);
        toggle.setOnClickListener(v -> toggleMode());
        card.addView(toggle, actionParams(2));

        Button close = button("Cancel", false);
        close.setBackgroundColor(Color.TRANSPARENT);
        close.setOnClickListener(v -> finish());
        card.addView(close, actionParams(2));

        TextView secure = Ui.text(this, "Secure sign-in · Google Identity + AniPins session", 11, Ui.FOG, false);
        secure.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, -2);
        sp.setMargins(0, Ui.dp(this, 18), 0, 0);
        card.addView(secure, sp);

        setContentView(root);
    }

    private LinearLayout.LayoutParams actionParams(int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, Ui.dp(this, 52));
        p.setMargins(0, Ui.dp(this, top), 0, 0);
        return p;
    }

    private LinearLayout.LayoutParams fieldParams() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, Ui.dp(this, 56));
        p.setMargins(0, Ui.dp(this, 9), 0, 0);
        return p;
    }

    private EditText input(String hint, int type) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setHintTextColor(Ui.FOG);
        e.setTextColor(Ui.PAPER);
        e.setTextSize(15);
        e.setInputType(type);
        e.setSingleLine();
        e.setPadding(Ui.dp(this, 17), 0, Ui.dp(this, 17), 0);
        e.setBackground(Ui.background(Ui.SOFT, Ui.dp(this, 17), Color.rgb(55,55,55)));
        return e;
    }

    private Button button(String text, boolean primary) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextSize(14);
        b.setAllCaps(false);
        b.setTextColor(primary ? Ui.INK : Ui.PAPER);
        b.setBackground(Ui.background(primary ? Ui.GOLD : Color.rgb(31,31,31), Ui.dp(this, 24), primary ? Ui.GOLD : Color.rgb(60,60,60)));
        return b;
    }

    private void toggleMode() {
        if (!challenge.isEmpty()) {
            challenge = "";
            code.setVisibility(View.GONE);
            email.setVisibility(View.VISIBLE);
            password.setVisibility(View.VISIBLE);
            google.setVisibility(View.VISIBLE);
            heading.setText(register ? "Join AniPins" : "Welcome back");
            copy.setText(register ? "Create an account to save artwork." : "Sign in to your AniPins account.");
            submit.setText(register ? "Create account" : "Sign in");
            toggle.setText(register ? "Already have an account? Sign in" : "New here? Create an account");
            return;
        }
        register = !register;
        name.setVisibility(register ? View.VISIBLE : View.GONE);
        heading.setText(register ? "Join AniPins" : "Welcome back");
        copy.setText(register ? "Create an account to save artwork." : "Sign in to your AniPins account.");
        submit.setText(register ? "Create account" : "Sign in");
        toggle.setText(register ? "Already have an account? Sign in" : "New here? Create an account");
    }

    private void submitPassword() {
        String mail = email.getText().toString().trim(), secret = password.getText().toString();
        try {
            JSONObject body;
            String endpoint;
            if (!challenge.isEmpty()) {
                String auth = code.getText().toString().trim();
                if (auth.length() < 6) { Toast.makeText(this, "Enter your authentication or recovery code", Toast.LENGTH_LONG).show(); return; }
                body = new JSONObject().put("challenge", challenge).put("code", auth);
                endpoint = "/api/auth/login";
            } else {
                if (!mail.contains("@") || secret.length() < 1) { Toast.makeText(this, "Enter your email and password", Toast.LENGTH_LONG).show(); return; }
                body = new JSONObject().put("email", mail).put("password", secret);
                if (register) body.put("name", name.getText().toString().trim());
                endpoint = register ? "/api/auth/register" : "/api/auth/login";
            }
            submit.setEnabled(false);
            submit.setText(challenge.isEmpty() ? (register ? "Creating…" : "Signing in…") : "Verifying…");
            api.post(endpoint, body, (status, data, error) -> {
                submit.setEnabled(true);
                if (status == 200 && data.optBoolean("requiresTwoFactor")) { enterTwoFactor(data.optString("challenge")); return; }
                if (status == 200) { Toast.makeText(this, "Signed in to AniPins", Toast.LENGTH_SHORT).show(); finish(); }
                else { submit.setText(register ? "Create account" : "Sign in"); Toast.makeText(this, data.optString("error", "Could not sign in."), Toast.LENGTH_LONG).show(); }
            });
        } catch (JSONException ignored) { submit.setEnabled(true); }
    }

    private void beginGoogleSignIn() {
        google.setEnabled(false);
        google.setText("Connecting to Google…");
        api.get("/api/auth/google/native-config", (status, config, error) -> {
            if (status != 200 || error != null || config.optString("clientId").isEmpty()) {
                google.setEnabled(true); google.setText("G   Continue with Google");
                Toast.makeText(this, "Google sign-in is not configured.", Toast.LENGTH_LONG).show();
                return;
            }
            api.get("/api/auth/google/native-nonce", (nonceStatus, nonceData, nonceError) -> {
                if (nonceStatus != 200 || nonceError != null || nonceData.optString("nonce").isEmpty()) {
                    google.setEnabled(true); google.setText("G   Continue with Google");
                    Toast.makeText(this, "Could not start Google sign-in.", Toast.LENGTH_LONG).show();
                    return;
                }
                pendingGoogleNonce = nonceData.optString("nonce");
                GetGoogleIdOption option = new GetGoogleIdOption.Builder()
                    .setServerClientId(config.optString("clientId"))
                    .setNonce(pendingGoogleNonce)
                    .setFilterByAuthorizedAccounts(false)
                    .setAutoSelectEnabled(false)
                    .build();
                GetCredentialRequest request = new GetCredentialRequest.Builder()
                    .addCredentialOption(option)
                    .build();
                credentialManager.getCredentialAsync(this, request, null, commandExecutor(), new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override public void onResult(GetCredentialResponse response) {
                        Credential credential = response.getCredential();
                        if (!(credential instanceof androidx.credentials.CustomCredential)) { googleFailed("Google returned an unsupported credential."); return; }
                        androidx.credentials.CustomCredential custom = (androidx.credentials.CustomCredential) credential;
                        if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(custom.getType())) { googleFailed("Google returned an unsupported credential."); return; }
                        try {
                            GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(custom.getData());
                            completeGoogle(googleCredential.getIdToken());
                        } catch (Exception e) { googleFailed("Could not read the Google credential."); }
                    }
                    @Override public void onError(GetCredentialException e) { googleFailed("Google sign-in was cancelled or unavailable."); }
                });
            });
        });
    }

    private java.util.concurrent.Executor commandExecutor() { return command -> runOnUiThread(command); }\n\n    private void completeGoogle(String idToken) {
        try {
            JSONObject body = new JSONObject().put("credential", idToken).put("nonce", pendingGoogleNonce);
            api.post("/api/auth/google", body, (status, data, error) -> {
                if (status == 200 && data.optBoolean("requiresTwoFactor")) {
                    enterTwoFactor(data.optString("challenge"));
                    return;
                }
                if (status == 200) {
                    Toast.makeText(this, "Signed in with Google", Toast.LENGTH_SHORT).show();
                    finish();
                } else googleFailed(data.optString("error", "Google sign-in failed."));
            });
        } catch (JSONException e) { googleFailed("Google sign-in failed."); }
    }

    private void enterTwoFactor(String nextChallenge) {
        challenge = nextChallenge;
        heading.setText("Security verification");
        copy.setText("Enter the code from your authenticator app or a recovery code.");
        name.setVisibility(View.GONE); email.setVisibility(View.GONE); password.setVisibility(View.GONE);
        code.setVisibility(View.VISIBLE); code.setText("");
        google.setVisibility(View.GONE); submit.setText("Verify and sign in"); toggle.setText("Back to sign in");
        google.setEnabled(true);
    }

    private void googleFailed(String message) {
        google.setEnabled(true); google.setText("G   Continue with Google");
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    static final class ImageViewHolder {
        final android.widget.ImageView view;
        ImageViewHolder(Activity activity) {
            view = new android.widget.ImageView(activity);
            view.setImageResource(R.drawable.ap_symbol);
            view.setScaleType(android.widget.ImageView.ScaleType.CENTER_INSIDE);
        }
    }
}
