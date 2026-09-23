package com.anipins.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.Window;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;
import android.widget.LinearLayout;

public class SplashActivity extends Activity {
    private static final long SPLASH_DURATION_MS = 1450L;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(0xFF000000);
        getWindow().setNavigationBarColor(0xFF000000);
        LinearLayout root = new LinearLayout(this);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xFF000000);
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ap_symbol);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        int size = (int) (180 * getResources().getDisplayMetrics().density);
        root.addView(logo, new LinearLayout.LayoutParams(size, size));
        setContentView(root);
        logo.setAlpha(0f);
        logo.setScaleX(0.72f);
        logo.setScaleY(0.72f);
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(650).setInterpolator(new AccelerateDecelerateInterpolator()).start();
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
