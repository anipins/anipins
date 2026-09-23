package com.anipins.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.Window;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public class SplashActivity extends Activity {
    private static final long DURATION = 1500L;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Ui.INK);
        getWindow().setNavigationBarColor(Ui.INK);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Ui.INK);

        android.view.View glow = new android.view.View(this);
        GradientDrawable glowBg = new GradientDrawable();
        glowBg.setShape(GradientDrawable.OVAL);
        glowBg.setColor(Color.rgb(38, 31, 20));
        glow.setBackground(glowBg);
        glow.setAlpha(0f);
        FrameLayout.LayoutParams gp = new FrameLayout.LayoutParams(Ui.dp(this, 300), Ui.dp(this, 300), Gravity.CENTER);
        root.addView(glow, gp);

        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ap_symbol);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        logo.setAlpha(0f);
        logo.setScaleX(.88f); logo.setScaleY(.88f);
        content.addView(logo, new LinearLayout.LayoutParams(Ui.dp(this, 132), Ui.dp(this, 132)));

        TextView name = Ui.text(this, "AniPins", 30, Ui.PAPER, true);
        name.setAlpha(0f);
        content.addView(name);

        TextView tagline = Ui.text(this, "DISCOVER  ·  SAVE  ·  CREATE", 10, Ui.FOG, false);
        tagline.setLetterSpacing(.18f);
        tagline.setAlpha(0f);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(-2, -2);
        tp.setMargins(0, Ui.dp(this, 10), 0, 0);
        content.addView(tagline, tp);

        FrameLayout.LayoutParams cp = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER);
        root.addView(content, cp);
        setContentView(root);

        glow.animate().alpha(.82f).scaleX(1.15f).scaleY(1.15f).setDuration(850).setInterpolator(new DecelerateInterpolator()).start();
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(700).setInterpolator(new DecelerateInterpolator()).start();
        name.animate().alpha(1f).setStartDelay(300).setDuration(420).start();
        tagline.animate().alpha(1f).setStartDelay(550).setDuration(400).start();

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent next = new Intent(this, MainActivity.class);
            if (getIntent() != null && getIntent().getData() != null) next.setData(getIntent().getData());
            startActivity(next);
            overridePendingTransition(0, 0);
            finish();
        }, DURATION);
    }
}