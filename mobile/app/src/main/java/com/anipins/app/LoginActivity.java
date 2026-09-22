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
import org.json.JSONException;
import org.json.JSONObject;

public class LoginActivity extends Activity {
    private ApiClient api; private boolean register; private String challenge="";
    private TextView heading,copy; private EditText name,email,password,code; private Button submit,toggle,google;

    @Override protected void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(Ui.INK);getWindow().setNavigationBarColor(Ui.INK);api=new ApiClient(this);render();}

    private void render(){
        LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(Ui.dp(this,24),Ui.dp(this,34),Ui.dp(this,24),Ui.dp(this,24)); root.setBackgroundColor(Ui.INK);
        TextView brand=Ui.text(this,"AP  AniPins",18,Ui.GOLD,true);brand.setGravity(Gravity.CENTER);root.addView(brand,new LinearLayout.LayoutParams(-1,Ui.dp(this,42)));
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(Ui.dp(this,24),Ui.dp(this,26),Ui.dp(this,24),Ui.dp(this,24));card.setBackground(Ui.background(Ui.PANEL,Ui.dp(this,28),Ui.PANEL));
        heading=Ui.text(this,"Welcome back",24,Ui.PAPER,true);card.addView(heading);
        copy=Ui.text(this,"Sign in to your account.",14,Ui.FOG,false);LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,Ui.dp(this,5),0,Ui.dp(this,18));card.addView(copy,cp);
        name=input("Name",InputType.TYPE_CLASS_TEXT);card.addView(name,fieldParams());name.setVisibility(View.GONE);
        email=input("Email",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);card.addView(email,fieldParams());
        password=input("Password",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);card.addView(password,fieldParams());
        code=input("Authentication code",InputType.TYPE_CLASS_TEXT);card.addView(code,fieldParams());code.setVisibility(View.GONE);
        submit=button("Sign in",true);submit.setOnClickListener(v->submit());LinearLayout.LayoutParams action=new LinearLayout.LayoutParams(-1,Ui.dp(this,52));action.setMargins(0,Ui.dp(this,16),0,0);card.addView(submit,action);
        google=button("Continue with Google",false);google.setOnClickListener(v->Toast.makeText(this,"Google sign-in is available on the AniPins website.",Toast.LENGTH_SHORT).show());card.addView(google,action);
        TextView or=Ui.text(this,"OR",11,Ui.FOG,true);or.setGravity(Gravity.CENTER);card.addView(or,new LinearLayout.LayoutParams(-1,Ui.dp(this,28)));
        toggle=button("New here? Create an account",false);toggle.setBackgroundColor(Color.TRANSPARENT);toggle.setOnClickListener(v->toggleMode());card.addView(toggle,action);
        Button close=button("Cancel",false);close.setBackgroundColor(Color.TRANSPARENT);close.setOnClickListener(v->finish());card.addView(close,action);
        root.addView(card,new LinearLayout.LayoutParams(-1,-2));setContentView(root);
    }
    private void toggleMode(){
        if(!challenge.isEmpty()){challenge="";code.setVisibility(View.GONE);email.setVisibility(View.VISIBLE);password.setVisibility(View.VISIBLE);google.setVisibility(View.VISIBLE);heading.setText(register?"Join AniPins":"Welcome back");copy.setText(register?"Create an account to save artwork.":"Sign in to your account.");submit.setText(register?"Create account":"Sign in");toggle.setText(register?"Already have an account? Sign in":"New here? Create an account");return;}
        register=!register;name.setVisibility(register?View.VISIBLE:View.GONE);heading.setText(register?"Join AniPins":"Welcome back");copy.setText(register?"Create an account to save artwork.":"Sign in to your account.");submit.setText(register?"Create account":"Sign in");toggle.setText(register?"Already have an account? Sign in":"New here? Create an account");
    }
    private LinearLayout.LayoutParams fieldParams(){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,Ui.dp(this,54));p.setMargins(0,Ui.dp(this,10),0,0);return p;}
    private EditText input(String hint,int type){EditText e=new EditText(this);e.setHint(hint);e.setHintTextColor(Ui.FOG);e.setTextColor(Ui.PAPER);e.setInputType(type);e.setSingleLine();e.setPadding(Ui.dp(this,16),0,Ui.dp(this,16),0);e.setBackground(Ui.background(Ui.SOFT,Ui.dp(this,16),Color.rgb(55,55,55)));return e;}
    private Button button(String text,boolean primary){Button b=new Button(this);b.setText(text);b.setAllCaps(false);b.setTextColor(Ui.PAPER);b.setBackground(Ui.background(primary?Ui.GOLD:Ui.SOFT,Ui.dp(this,22),primary?Ui.GOLD:Color.rgb(55,55,55)));return b;}
    private void submit(){
        String mail=email.getText().toString().trim(),secret=password.getText().toString();
        try{
            JSONObject body;
            String endpoint;
            if(!challenge.isEmpty()){String auth=code.getText().toString().trim();if(auth.length()<6){Toast.makeText(this,"Enter your authentication or recovery code",Toast.LENGTH_LONG).show();return;}body=new JSONObject().put("challenge",challenge).put("code",auth);endpoint="/api/auth/login";}
            else {if(!mail.contains("@")||secret.length()<1){Toast.makeText(this,"Enter your email and password",Toast.LENGTH_LONG).show();return;}body=new JSONObject().put("email",mail).put("password",secret);if(register)body.put("name",name.getText().toString().trim());endpoint=register?"/api/auth/register":"/api/auth/login";}
            submit.setEnabled(false);submit.setText(challenge.isEmpty()?(register?"Creating…":"Signing in…"):"Verifying…");
            api.post(endpoint,body,(status,data,error)->{submit.setEnabled(true);if(status==200&&data.optBoolean("requiresTwoFactor")){challenge=data.optString("challenge");heading.setText("Security verification");copy.setText("Enter the code from your authenticator app or a recovery code.");name.setVisibility(View.GONE);email.setVisibility(View.GONE);password.setVisibility(View.GONE);code.setVisibility(View.VISIBLE);code.setText("");submit.setText("Verify and sign in");toggle.setText("Back to sign in");google.setVisibility(View.GONE);return;}if(status==200){Toast.makeText(this,"Signed in to AniPins",Toast.LENGTH_SHORT).show();finish();}else{submit.setText(register?"Create account":"Sign in");Toast.makeText(this,data.optString("error","Could not sign in. Check your connection."),Toast.LENGTH_LONG).show();}});
        }catch(JSONException ignored){submit.setEnabled(true);}
    }
}