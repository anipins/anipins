package com.anipins.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.View;
import android.widget.TextView;

final class Ui {
    static final int INK = Color.rgb(8, 8, 8);
    static final int PANEL = Color.rgb(20, 20, 20);
    static final int SOFT = Color.rgb(31, 31, 31);
    static final int PAPER = Color.rgb(240, 239, 236);
    static final int FOG = Color.rgb(160, 160, 160);
    static final int GOLD = Color.rgb(198, 161, 91);

    static int dp(Context context, float value) { return Math.round(value * context.getResources().getDisplayMetrics().density); }
    static GradientDrawable background(int color, float radius, int strokeColor) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(color); shape.setCornerRadius(radius);
        if (strokeColor != Color.TRANSPARENT) shape.setStroke(1, strokeColor);
        return shape;
    }
    static TextView text(Context context, String value, float size, int color, boolean bold) {
        TextView view = new TextView(context); view.setText(value); view.setTextSize(size); view.setTextColor(color);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }
    static void clickable(View view) { view.setBackground(background(SOFT, dp(view.getContext(), 18), Color.rgb(55, 55, 55))); view.setPadding(dp(view.getContext(), 16), dp(view.getContext(), 12), dp(view.getContext(), 16), dp(view.getContext(), 12)); }
    private Ui() {}
}
