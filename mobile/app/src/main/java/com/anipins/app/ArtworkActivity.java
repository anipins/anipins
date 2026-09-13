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
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.StaggeredGridLayoutManager;

import com.bumptech.glide.Glide;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ArtworkActivity extends Activity {
    private ApiClient api; private LinearLayout content; private int artworkId; private Artwork artwork;
    @Override protected void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(Ui.INK);getWindow().setNavigationBarColor(Ui.INK);api=new ApiClient(this);artworkId=getIntent().getIntExtra("id",0);buildLoading();load();}
    private void buildLoading(){LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Ui.INK);LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(Ui.dp(this,12),Ui.dp(this,8),Ui.dp(this,16),Ui.dp(this,8));Button back=button("←");back.setOnClickListener(v->finish());bar.addView(back,new LinearLayout.LayoutParams(Ui.dp(this,52),Ui.dp(this,48)));TextView name=Ui.text(this,"Artwork",20,Ui.PAPER,true);name.setPadding(Ui.dp(this,12),0,0,0);bar.addView(name);root.addView(bar);ProgressBar loading=new ProgressBar(this);root.addView(loading,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));setContentView(root);}
    private Button button(String text){Button button=new Button(this);button.setText(text);button.setAllCaps(false);button.setTextColor(Ui.PAPER);button.setBackground(Ui.background(Ui.SOFT,Ui.dp(this,20),Color.rgb(55,55,55)));return button;}
    private void load(){api.get("/api/artworks/"+artworkId,(status,data,error)->{if(status!=200||error!=null){Toast.makeText(this,"Artwork could not be loaded",Toast.LENGTH_LONG).show();finish();return;}artwork=new Artwork(data.optJSONObject("art"));render(data);});}
    private void render(JSONObject data){ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(Ui.INK);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(Ui.dp(this,14),Ui.dp(this,12),Ui.dp(this,14),Ui.dp(this,30));scroll.addView(content);
        Button back=button("← Back");back.setOnClickListener(v->finish());content.addView(back,new LinearLayout.LayoutParams(Ui.dp(this,92),Ui.dp(this,46)));
        ZoomImageView image=new ZoomImageView(this);LinearLayout.LayoutParams imageParams=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,540));imageParams.setMargins(0,Ui.dp(this,12),0,0);content.addView(image,imageParams);Glide.with(this).load(artwork.originalUrl()).thumbnail(Glide.with(this).load(artwork.thumbUrl())).into(image);
        TextView hint=Ui.text(this,"Pinch, pan or double-tap to zoom",12,Ui.FOG,false);hint.setGravity(Gravity.CENTER);hint.setPadding(0,Ui.dp(this,8),0,0);content.addView(hint);
        TextView heading=Ui.text(this,artwork.displayTitle(),26,Ui.PAPER,true);heading.setPadding(0,Ui.dp(this,22),0,0);content.addView(heading);TextView meta=Ui.text(this,artwork.character+" · "+artwork.anime+(artwork.gender.isEmpty()?"":" · "+artwork.gender),14,Ui.GOLD,false);meta.setPadding(0,Ui.dp(this,6),0,0);content.addView(meta);
        if(!artwork.description.isEmpty()){TextView description=Ui.text(this,artwork.description,14,Ui.FOG,false);description.setPadding(0,Ui.dp(this,12),0,0);content.addView(description);}if(!artwork.tags.isEmpty()){TextView tags=Ui.text(this,"#"+artwork.tags.replace(",","  #"),13,Ui.FOG,false);tags.setPadding(0,Ui.dp(this,10),0,0);content.addView(tags);}
        LinearLayout follows=new LinearLayout(this);follows.setPadding(0,Ui.dp(this,14),0,0);Button followCharacter=button("Follow "+artwork.character);Button followAnime=button("Follow "+artwork.anime);followCharacter.setOnClickListener(v->follow("character",artwork.characterSlug,artwork.character,followCharacter));followAnime.setOnClickListener(v->follow("anime",artwork.animeSlug,artwork.anime,followAnime));LinearLayout.LayoutParams followParams=new LinearLayout.LayoutParams(0,Ui.dp(this,48),1);followParams.setMargins(Ui.dp(this,3),0,Ui.dp(this,3),0);follows.addView(followCharacter,followParams);follows.addView(followAnime,followParams);content.addView(follows);
        LinearLayout actions=new LinearLayout(this);actions.setPadding(0,Ui.dp(this,18),0,0);String[] labels={"Save","Like","Download","Share"};for(String label:labels){Button action=button(label);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,Ui.dp(this,50),1);p.setMargins(Ui.dp(this,3),0,Ui.dp(this,3),0);actions.addView(action,p);if(label.equals("Save"))action.setOnClickListener(v->save());if(label.equals("Like"))action.setOnClickListener(v->like(action));if(label.equals("Download"))action.setOnClickListener(v->download());if(label.equals("Share"))action.setOnClickListener(v->share());}content.addView(actions);
        JSONArray related=data.optJSONArray("related");if(related!=null&&related.length()>0){TextView more=Ui.text(this,"More to explore",22,Ui.PAPER,true);more.setPadding(0,Ui.dp(this,30),0,Ui.dp(this,8));content.addView(more);RecyclerView list=new RecyclerView(this);list.setNestedScrollingEnabled(false);list.setLayoutManager(new StaggeredGridLayoutManager(2,StaggeredGridLayoutManager.VERTICAL));ArtworkAdapter adapter=new ArtworkAdapter(item->{Intent intent=new Intent(this,ArtworkActivity.class);intent.putExtra("id",item.id);startActivity(intent);});List<Artwork> values=new ArrayList<>();for(int i=0;i<related.length();i++)values.add(new Artwork(related.optJSONObject(i)));adapter.replace(values);list.setAdapter(adapter);content.addView(list,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,Math.min(3000,values.size()*175))));}
        setContentView(scroll);
    }
    private void save(){try{JSONObject body=new JSONObject().put("artworkId",artworkId);api.post("/api/saves",body,(status,data,error)->{if(status==401){openLogin();return;}Toast.makeText(this,status==200?"Saved to your AniPins collection":"Could not save artwork",Toast.LENGTH_SHORT).show();});}catch(JSONException ignored){}}
    private void follow(String kind,String value,String label,Button button){try{JSONObject body=new JSONObject().put("kind",kind).put("value",value).put("label",label);api.post("/api/follows",body,(status,data,error)->{if(status==401){openLogin();return;}if(status==200){button.setText("Following");button.setTextColor(Ui.GOLD);}else Toast.makeText(this,data.optString("error","Could not follow"),Toast.LENGTH_LONG).show();});}catch(JSONException ignored){}}
    private void like(Button button){try{api.post("/api/likes",new JSONObject().put("artworkId",artworkId),(status,data,error)->{if(status==401){openLogin();return;}if(status==200){button.setText(data.optBoolean("liked")?"Liked ♥":"Like");Toast.makeText(this,data.optBoolean("liked")?"Artwork liked":"Like removed",Toast.LENGTH_SHORT).show();}});}catch(JSONException ignored){}}
    private void openLogin(){startActivity(new Intent(this,LoginActivity.class));}
    private void download(){try{DownloadManager.Request request=new DownloadManager.Request(Uri.parse(BuildConfig.API_BASE_URL+"/api/artworks/"+artworkId+"/download"));String cookie=api.session().read();if(!cookie.isEmpty())request.addRequestHeader("Cookie",cookie);request.setTitle("AniPins · "+artwork.displayTitle());request.setDescription("Saving artwork to Downloads");request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,"AniPins-"+artwork.character.replaceAll("[^a-zA-Z0-9]+","-")+"-"+artworkId+".jpg");((DownloadManager)getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);Toast.makeText(this,"Download started",Toast.LENGTH_SHORT).show();}catch(Exception error){Toast.makeText(this,"Download failed",Toast.LENGTH_LONG).show();}}
    private void share(){Intent intent=new Intent(Intent.ACTION_SEND);intent.setType("text/plain");intent.putExtra(Intent.EXTRA_SUBJECT,artwork.displayTitle()+" on AniPins");intent.putExtra(Intent.EXTRA_TEXT,artwork.displayTitle()+" · "+artwork.anime+"\n"+artwork.webUrl());startActivity(Intent.createChooser(intent,"Share artwork"));}
}
