package com.anipins.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private static final long SPLASH_DURATION_MS = 1900L;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.rgb(8,8,8));
        getWindow().setNavigationBarColor(Color.rgb(8,8,8));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8,8,8));

        View aura = new View(this);
        GradientDrawable auraBg = new GradientDrawable();
        auraBg.setShape(GradientDrawable.OVAL);
        auraBg.setColor(Color.rgb(42,35,24));
        aura.setBackground(auraBg);
        aura.setAlpha(0f);
        FrameLayout.LayoutParams auraParams = new FrameLayout.LayoutParams(Ui.dp(this, 250), Ui.dp(this, 250), Gravity.CENTER);
        root.addView(aura, auraParams);

        View ring = new View(this);
        GradientDrawable ringBg = new GradientDrawable();
        ringBg.setShape(GradientDrawable.OVAL);
        ringBg.setColor(Color.TRANSPARENT);
        ringBg.setStroke(Ui.dp(this, 1), Ui.GOLD);
        ring.setBackground(ringBg);
        ring.setAlpha(0f);
        FrameLayout.LayoutParams ringParams = new FrameLayout.LayoutParams(Ui.dp(this, 190), Ui.dp(this, 190), Gravity.CENTER);
        root.addView(ring, ringParams);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ap_symbol);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        logo.setAlpha(0f);
        logo.setScaleX(.78f); logo.setScaleY(.78f);
        content.addView(logo, new LinearLayout.LayoutParams(Ui.dp(this, 138), Ui.dp(this, 138)));

        TextView name = Ui.text(this, "AniPins", 28, Ui.PAPER, true);
        name.setAlpha(0f);
        content.addView(name);

        TextView tagline = Ui.text(this, "Discover  ·  Save  ·  Create", 10, Ui.FOG, false);
        tagline.setAlpha(0f);
        tagline.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-2, -2);
        tp.setMargins(0, Ui.dp(this, 10), 0, 0);
        content.addView(tagline, tp);

        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER);
        contentParams.topMargin = Ui.dp(this, 8);
        root.addView(content, contentParams);
        setContentView(root);

        aura.animate().alpha(.72f).scaleX(1.08f).scaleY(1.08f).setDuration(900).setInterpolator(new AccelerateDecelerateInterpolator()).start();
        ring.animate().alpha(.65f).scaleX(1f).scaleY(1f).setDuration(900).setInterpolator(new AccelerateDecelerateInterpolator()).start();
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(850).setInterpolator(new AccelerateDecelerateInterpolator()).start();
        name.animate().alpha(1f).setStartDelay(420).setDuration(520).start();
        tagline.animate().alpha(1f).setStartDelay(700).setDuration(480).start();

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent next = new Intent(this, MainActivity.class);
            Intent source = getIntent();
            if (source != null && source.getData() != null) next.setData(source.getData());
            next.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
            startActivity(next);
            overridePendingTransition(0, 0);
            finish();
        }, SPLASH_DURATION_MS);
    }
}
