package com.anipins.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

public class SplashActivity extends Activity {
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.rgb(8, 8, 8));
        getWindow().setNavigationBarColor(Color.rgb(8, 8, 8));
        Intent next = new Intent(this, MainActivity.class);
        if (getIntent() != null && getIntent().getData() != null) next.setData(getIntent().getData());
        startActivity(next);
        overridePendingTransition(0, 0);
        finish();
    }
}