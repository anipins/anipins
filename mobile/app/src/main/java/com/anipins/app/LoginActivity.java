package com.anipins.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONException;
import org.json.JSONObject;

public class LoginActivity extends Activity {
    private ApiClient api; private boolean register; private TextView heading; private EditText name,email,password; private Button submit,toggle;
    @Override protected void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(Ui.INK);getWindow().setNavigationBarColor(Ui.INK);api=new ApiClient(this);render();}
    private void render(){LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setGravity(Gravity.CENTER_HORIZONTAL);root.setPadding(Ui.dp(this,24),Ui.dp(this,50),Ui.dp(this,24),Ui.dp(this,24));root.setBackgroundColor(Ui.INK);TextView brand=Ui.text(this,"AP  AniPins",22,Ui.GOLD,true);root.addView(brand);heading=Ui.text(this,"Welcome back",30,Ui.PAPER,true);heading.setPadding(0,Ui.dp(this,34),0,Ui.dp(this,8));root.addView(heading);TextView copy=Ui.text(this,"Sign in to sync your saves, follows and collections.",14,Ui.FOG,false);copy.setGravity(Gravity.CENTER);root.addView(copy);
        name=input("Nickname (optional)",InputType.TYPE_CLASS_TEXT);name.setVisibility(android.view.View.GONE);root.addView(name,fieldParams());email=input("Email",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);root.addView(email,fieldParams());password=input("Password",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);root.addView(password,fieldParams());submit=button("Sign in");submit.setOnClickListener(v->submit());LinearLayout.LayoutParams submitParams=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,54));submitParams.setMargins(0,Ui.dp(this,18),0,0);root.addView(submit,submitParams);toggle=button("New here? Create an account");toggle.setBackgroundColor(Color.TRANSPARENT);toggle.setOnClickListener(v->{register=!register;name.setVisibility(register?android.view.View.VISIBLE:android.view.View.GONE);heading.setText(register?"Create your account":"Welcome back");submit.setText(register?"Create account":"Sign in");toggle.setText(register?"Already have an account? Sign in":"New here? Create an account");});root.addView(toggle,submitParams);Button close=button("Cancel");close.setBackgroundColor(Color.TRANSPARENT);close.setOnClickListener(v->finish());root.addView(close,submitParams);setContentView(root);}
    private LinearLayout.LayoutParams fieldParams(){LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,58));params.setMargins(0,Ui.dp(this,14),0,0);return params;}
    private EditText input(String hint,int type){EditText input=new EditText(this);input.setHint(hint);input.setHintTextColor(Ui.FOG);input.setTextColor(Ui.PAPER);input.setInputType(type);input.setSingleLine();input.setPadding(Ui.dp(this,18),0,Ui.dp(this,18),0);input.setBackground(Ui.background(Ui.SOFT,Ui.dp(this,18),Color.rgb(55,55,55)));return input;}
    private Button button(String text){Button button=new Button(this);button.setText(text);button.setAllCaps(false);button.setTextColor(Ui.PAPER);button.setBackground(Ui.background(Ui.SOFT,Ui.dp(this,24),Color.rgb(55,55,55)));return button;}
    private void submit(){String mail=email.getText().toString().trim(),secret=password.getText().toString();if(!mail.contains("@")||secret.length()<6){Toast.makeText(this,"Enter a valid email and password of at least 6 characters",Toast.LENGTH_LONG).show();return;}submit.setEnabled(false);submit.setText(register?"Creating…":"Signing in…");try{JSONObject body=new JSONObject().put("email",mail).put("password",secret);if(register)body.put("name",name.getText().toString().trim());api.post(register?"/api/auth/register":"/api/auth/login",body,(status,data,error)->{submit.setEnabled(true);submit.setText(register?"Create account":"Sign in");if(status==200){Toast.makeText(this,"Signed in to AniPins",Toast.LENGTH_SHORT).show();finish();}else Toast.makeText(this,data.optString("error","Could not sign in. Check your connection."),Toast.LENGTH_LONG).show();});}catch(JSONException ignored){submit.setEnabled(true);}}
}
