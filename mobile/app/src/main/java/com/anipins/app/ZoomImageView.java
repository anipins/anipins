package com.anipins.app;

import android.content.Context;
import android.graphics.Matrix;
import android.graphics.drawable.Drawable;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.widget.ImageView;

final class ZoomImageView extends ImageView {
    private final Matrix matrix = new Matrix(); private final ScaleGestureDetector scaleDetector; private final GestureDetector gestureDetector;
    private float scale = 1f, lastX, lastY; private boolean dragging;
    ZoomImageView(Context context) {
        super(context); setScaleType(ScaleType.MATRIX); setBackgroundColor(Ui.INK);
        scaleDetector = new ScaleGestureDetector(context, new ScaleGestureDetector.SimpleOnScaleGestureListener(){@Override public boolean onScale(ScaleGestureDetector detector){float next=Math.max(1f,Math.min(5f,scale*detector.getScaleFactor()));float factor=next/scale;scale=next;matrix.postScale(factor,factor,detector.getFocusX(),detector.getFocusY());setImageMatrix(matrix);return true;}});
        gestureDetector = new GestureDetector(context,new GestureDetector.SimpleOnGestureListener(){@Override public boolean onDoubleTap(MotionEvent event){if(scale>1.1f){reset();}else{scale=2.5f;matrix.postScale(2.5f,2.5f,event.getX(),event.getY());setImageMatrix(matrix);}return true;}});
    }
    private void reset(){scale=1f;matrix.reset();fit();}
    private void fit(){Drawable drawable=getDrawable();if(drawable==null||getWidth()==0)return;float sx=(float)getWidth()/drawable.getIntrinsicWidth(),sy=(float)getHeight()/drawable.getIntrinsicHeight(),fit=Math.min(sx,sy);float dx=(getWidth()-drawable.getIntrinsicWidth()*fit)/2f,dy=(getHeight()-drawable.getIntrinsicHeight()*fit)/2f;matrix.setScale(fit,fit);matrix.postTranslate(dx,dy);setImageMatrix(matrix);}
    @Override protected void onSizeChanged(int w,int h,int oldw,int oldh){super.onSizeChanged(w,h,oldw,oldh);post(this::fit);}
    @Override public void setImageDrawable(Drawable drawable){super.setImageDrawable(drawable);post(this::reset);}
    @Override public boolean onTouchEvent(MotionEvent event){scaleDetector.onTouchEvent(event);gestureDetector.onTouchEvent(event);if(event.getAction()==MotionEvent.ACTION_DOWN){lastX=event.getX();lastY=event.getY();dragging=true;}else if(event.getAction()==MotionEvent.ACTION_MOVE&&dragging&&scale>1f&&!scaleDetector.isInProgress()){matrix.postTranslate(event.getX()-lastX,event.getY()-lastY);setImageMatrix(matrix);lastX=event.getX();lastY=event.getY();}else if(event.getAction()==MotionEvent.ACTION_UP||event.getAction()==MotionEvent.ACTION_CANCEL)dragging=false;return true;}
}
