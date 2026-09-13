package com.anipins.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

public class LegalActivity extends Activity {
    private static final int PICK_FILES=401; private WebView web; private ValueCallback<Uri[]> picker;
    @Override protected void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(Ui.INK);getWindow().setNavigationBarColor(Ui.INK);LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Ui.INK);LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(Ui.dp(this,8),Ui.dp(this,6),Ui.dp(this,12),Ui.dp(this,6));Button close=new Button(this);close.setText("← "+getIntent().getStringExtra("title"));close.setAllCaps(false);close.setTextColor(Ui.PAPER);close.setBackgroundColor(Color.TRANSPARENT);close.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);close.setOnClickListener(v->{if(web.canGoBack())web.goBack();else finish();});bar.addView(close,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,50)));root.addView(bar);web=new WebView(this);web.setBackgroundColor(Ui.INK);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowContentAccess(true);settings.setAllowFileAccess(true);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);CookieManager cookies=CookieManager.getInstance();cookies.setAcceptCookie(true);String session=new SessionVault(this).read();if(!session.isEmpty())cookies.setCookie(BuildConfig.API_BASE_URL,session+"; Path=/; Secure; SameSite=Lax");web.setWebViewClient(new WebViewClient());web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(picker!=null)picker.onReceiveValue(null);picker=callback;try{Intent intent=params.createIntent();intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);startActivityForResult(intent,PICK_FILES);return true;}catch(Exception error){picker=null;return false;}}});web.setDownloadListener((url,userAgent,disposition,mime,length)->download(url,userAgent,disposition,mime));root.addView(web,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));setContentView(root);web.loadUrl(BuildConfig.API_BASE_URL+getIntent().getStringExtra("path"));}
    private void download(String url,String userAgent,String disposition,String mime){try{DownloadManager.Request request=new DownloadManager.Request(Uri.parse(url));String cookie=CookieManager.getInstance().getCookie(url);if(cookie!=null)request.addRequestHeader("Cookie",cookie);request.addRequestHeader("User-Agent",userAgent);request.setTitle(android.webkit.URLUtil.guessFileName(url,disposition,mime));request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,android.webkit.URLUtil.guessFileName(url,disposition,mime));((DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);Toast.makeText(this,"Download started",Toast.LENGTH_SHORT).show();}catch(Exception error){Toast.makeText(this,"Download failed",Toast.LENGTH_LONG).show();}}
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){super.onActivityResult(requestCode,resultCode,data);if(requestCode==PICK_FILES&&picker!=null){picker.onReceiveValue(resultCode==RESULT_OK?WebChromeClient.FileChooserParams.parseResult(resultCode,data):null);picker=null;}}
    @Override protected void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}
