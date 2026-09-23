package com.anipins.app;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;


import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.StaggeredGridLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public class MainActivity extends Activity {
    private static final String INSTAGRAM_URL = "https://www.instagram.com/_anipinss_/";
    private static final String NOTIFICATION_CHANNEL = "anipins_updates";
    private ApiClient api; private FrameLayout body; private TextView title, subtitle; private ProgressBar progress;
    private SwipeRefreshLayout swipe; private ArtworkAdapter adapter; private String currentPath = "/api/artworks?sort=for-you&limit=30";
    private int lastRandomFirstId = -1, feedPage = 0; private boolean feedLoading = false, feedHasMore = true;
    private final Handler handler = new Handler(Looper.getMainLooper()); private Runnable pendingSearch;
    private final List<TextView> navItems = new ArrayList<>();

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state); requestWindowFeature(Window.FEATURE_NO_TITLE); getWindow().setStatusBarColor(Ui.INK); getWindow().setNavigationBarColor(Ui.INK);
        api = new ApiClient(this); setContentView(buildShell()); handleDeepLink(getIntent()); if (state == null) showHome(); checkForNotifications(); if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1001); checkForUpdate();
    }

    private View buildShell() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Ui.INK);

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(Ui.dp(this, 18), Ui.dp(this, 12), Ui.dp(this, 18), Ui.dp(this, 8));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ap_symbol);
        logo.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        header.addView(logo, new LinearLayout.LayoutParams(Ui.dp(this, 48), Ui.dp(this, 48)));

        LinearLayout headings = new LinearLayout(this);
        headings.setOrientation(LinearLayout.VERTICAL);
        headings.setPadding(Ui.dp(this, 13), 0, 0, 0);
        title = Ui.text(this, "For You", 23, Ui.PAPER, true);
        subtitle = Ui.text(this, "A fresh mix every time", 12, Ui.FOG, false);
        headings.addView(title);
        headings.addView(subtitle);
        header.addView(headings, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        root.addView(header);

        Button search = button("⌕   Search anime, characters & artwork");
        search.setTextSize(14);
        search.setGravity(Gravity.CENTER_VERTICAL);
        search.setPadding(Ui.dp(this, 18), 0, Ui.dp(this, 18), 0);
        search.setContentDescription("Search AniPins");
        search.setOnClickListener(v -> showSearch());
        LinearLayout.LayoutParams searchParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 52));
        searchParams.setMargins(Ui.dp(this, 16), 0, Ui.dp(this, 16), Ui.dp(this, 10));
        root.addView(search, searchParams);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setIndeterminate(true);
        progress.setVisibility(View.GONE);
        root.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 2)));

        body = new FrameLayout(this);
        root.addView(body, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        LinearLayout nav = new LinearLayout(this);
        nav.setPadding(Ui.dp(this, 10), Ui.dp(this, 7), Ui.dp(this, 10), Ui.dp(this, 9));
        nav.setGravity(Gravity.CENTER);
        nav.setBackgroundColor(Ui.PANEL);
        addNav(nav, "⌂", "For You", this::showHome);
        addNav(nav, "◇", "Discover", this::showExplore);
        addNav(nav, "♡", "Following", this::showFollowing);
        addNav(nav, "○", "Profile", this::showProfile);
        root.addView(nav);
        return root;
    }

    private Button button(String label) {
        Button value = new Button(this);
        value.setText(label);
        value.setTextColor(Ui.PAPER);
        value.setTextSize(13);
        value.setAllCaps(false);
        value.setMinHeight(0);
        value.setMinimumHeight(0);
        value.setBackground(Ui.background(Ui.SOFT, Ui.dp(this, 22), Color.rgb(58,58,58)));
        return value;
    }

    private void addNav(LinearLayout parent, String icon, String label, Runnable action) {
        TextView tab = Ui.text(this, icon + "\n" + label, 12, Ui.FOG, false);
        tab.setGravity(Gravity.CENTER);
        tab.setLineSpacing(0, 1.0f);
        tab.setPadding(0, Ui.dp(this, 5), 0, Ui.dp(this, 4));
        int index = navItems.size();
        navItems.add(tab);
        tab.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
            selectNav(index);
            action.run();
        });
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, Ui.dp(this, 68), 1);
        params.setMargins(Ui.dp(this, 4), 0, Ui.dp(this, 4), 0);
        parent.addView(tab, params);
    }

    private void selectNav(int selected) {
        for (int i = 0; i < navItems.size(); i++) {
            TextView item = navItems.get(i);
            boolean active = i == selected;
            item.setTextColor(active ? Ui.GOLD : Ui.FOG);
            item.setTypeface(android.graphics.Typeface.create("serif", active ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL));
            item.setBackground(Ui.background(active ? Color.rgb(39,34,23) : Color.TRANSPARENT, Ui.dp(this, 20), Color.TRANSPARENT));
        }
    }

    private void showHome() { selectNav(0); title.setText("For You"); subtitle.setText("A fresh mix every time"); currentPath = "/api/artworks?sort=random&limit=30&seed=" + (new Random().nextInt(2_000_000_000) + 1); showGrid(currentPath); }
    private void showExplore() {
        selectNav(1);
        title.setText("Discover"); subtitle.setText("Anime, characters and artwork");
        LinearLayout container = new LinearLayout(this); container.setOrientation(LinearLayout.VERTICAL); container.setBackgroundColor(Ui.INK);
        LinearLayout filters = new LinearLayout(this); filters.setPadding(Ui.dp(this, 12), Ui.dp(this, 4), Ui.dp(this, 12), Ui.dp(this, 6));
        for (String sort : new String[]{"Latest", "Trending", "Popular"}) { Button chip = button(sort); LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, Ui.dp(this, 44), 1); p.setMargins(Ui.dp(this, 3),0,Ui.dp(this,3),0); filters.addView(chip,p); chip.setOnClickListener(v -> { currentPath = "/api/artworks?sort=" + sort.toLowerCase() + "&limit=30"; loadGrid(currentPath); }); }
        container.addView(filters);
        ScrollView scroll = new ScrollView(this); LinearLayout hubs = new LinearLayout(this); hubs.setOrientation(LinearLayout.VERTICAL); hubs.setPadding(Ui.dp(this, 14), Ui.dp(this, 4), Ui.dp(this, 14), Ui.dp(this, 18));
        hubs.addView(Ui.text(this, "Explore hubs", 19, Ui.PAPER, true));
        hubs.addView(Ui.text(this, "Jump straight into popular anime and characters.", 13, Ui.FOG, false));
        api.get("/api/discover", (status, data, error) -> {
            if (status != 200 || error != null) { hubs.addView(Ui.text(this, "Hubs are temporarily unavailable.", 13, Ui.FOG, false)); }
            else {
                addHubSection(hubs, "Anime", data.optJSONArray("anime"), "anime");
                addHubSection(hubs, "Characters", data.optJSONArray("characters"), "character");
            }
            Button browse = button("Browse trending artwork");
            browse.setOnClickListener(v -> {
                currentPath = "/api/artworks?sort=trending&limit=30";
                title.setText("Trending"); subtitle.setText("Trending across AniPins");
                showGrid(currentPath);
            });
            LinearLayout.LayoutParams browseParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 52));
            browseParams.setMargins(0, Ui.dp(this, 16), 0, 0);
            hubs.addView(browse, browseParams);
        });
        scroll.addView(hubs); body.removeAllViews(); body.addView(scroll);
    }

    private void addHubSection(LinearLayout parent, String heading, JSONArray items, String kind) {
        parent.addView(Ui.text(this, heading, 18, Ui.PAPER, true));
        if (items == null || items.length() == 0) { parent.addView(Ui.text(this, "No entries yet.", 13, Ui.FOG, false)); return; }
        for (int i = 0; i < Math.min(items.length(), 8); i++) {
            JSONObject item = items.optJSONObject(i); if (item == null) continue;
            String name = item.optString("name", "Unknown");
            String slug = item.optString("slug", "");
            int count = item.optInt("artwork_count", 0);
            Button card = button(name + "  ·  " + count + " artworks");
            card.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            card.setOnClickListener(v -> {
                String param = kind + "=" + Uri.encode(slug);
                currentPath = "/api/artworks?" + param + "&sort=latest&limit=30";
                title.setText(name); subtitle.setText(kind.equals("anime") ? "Anime hub" : "Character hub");
                showGrid(currentPath);
            });
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 52));
            p.setMargins(0, Ui.dp(this, 6), 0, 0); parent.addView(card, p);
        }
    }
    private void showSearch() {
        title.setText("Search"); subtitle.setText("Characters, anime, tags and artwork");
        LinearLayout container = new LinearLayout(this); container.setOrientation(LinearLayout.VERTICAL); container.setBackgroundColor(Ui.INK);
        EditText input = new EditText(this); input.setHint("Search AniPins"); input.setHintTextColor(Ui.FOG); input.setTextColor(Ui.PAPER); input.setSingleLine(); input.setBackground(Ui.background(Ui.SOFT, Ui.dp(this, 20), Color.rgb(55,55,55))); input.setPadding(Ui.dp(this,18),0,Ui.dp(this,18),0);
        LinearLayout.LayoutParams inputParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 54)); inputParams.setMargins(Ui.dp(this,14),Ui.dp(this,6),Ui.dp(this,14),Ui.dp(this,8)); container.addView(input,inputParams);
        View grid = createGrid(); container.addView(grid, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1)); body.removeAllViews(); body.addView(container);
        input.addTextChangedListener(new TextWatcher() { public void beforeTextChanged(CharSequence s,int a,int b,int c){} public void onTextChanged(CharSequence s,int a,int b,int c){ if(pendingSearch!=null)handler.removeCallbacks(pendingSearch); pendingSearch=()->{ String q=Uri.encode(s.toString().trim()); currentPath=q.isEmpty()?"/api/artworks?sort=random&limit=30&seed="+System.currentTimeMillis():"/api/artworks?q="+q+"&limit=30"; loadGrid(currentPath);}; handler.postDelayed(pendingSearch,400);} public void afterTextChanged(Editable e){} });
        input.requestFocus(); currentPath = "/api/artworks?sort=random&limit=30&seed=" + System.currentTimeMillis(); loadGrid(currentPath);
    }

    private void showGrid(String path) { body.removeAllViews(); body.addView(createGrid()); loadGrid(path); }
    private View createGrid() {
        swipe = new SwipeRefreshLayout(this); swipe.setColorSchemeColors(Ui.GOLD); RecyclerView list = new RecyclerView(this); list.setBackgroundColor(Ui.INK); list.setPadding(Ui.dp(this,8),0,Ui.dp(this,8),Ui.dp(this,16)); list.setClipToPadding(false); list.setHasFixedSize(false); list.setItemViewCacheSize(8); list.setDrawingCacheEnabled(false); list.setOverScrollMode(View.OVER_SCROLL_NEVER);
        StaggeredGridLayoutManager manager=new StaggeredGridLayoutManager(getResources().getConfiguration().smallestScreenWidthDp >= 600 ? 3 : 2, StaggeredGridLayoutManager.VERTICAL); list.setLayoutManager(manager); adapter = new ArtworkAdapter(this::openArtwork); list.setAdapter(adapter);
        list.addOnScrollListener(new RecyclerView.OnScrollListener(){@Override public void onScrolled(RecyclerView view,int dx,int dy){super.onScrolled(view,dx,dy);if(dy<=0||feedLoading||!feedHasMore)return;int[] visible=manager.findLastVisibleItemPositions(null);int last=0;for(int value:visible)last=Math.max(last,value);if(last>=adapter.getItemCount()-8)loadGridPage(currentPath,false);}});
        swipe.addView(list); swipe.setOnRefreshListener(() -> { if (currentPath.contains("for-you") || currentPath.contains("sort=random")) currentPath = currentPath.replaceAll("seed=[^&]*", "seed=" + System.currentTimeMillis()); loadGrid(currentPath); }); return swipe;
    }
    private void loadGrid(String path) {
        feedPage=0;feedHasMore=true;loadGridPage(path,true);
    }
    private void loadGridPage(String path,boolean reset) {
        if(feedLoading)return;feedLoading=true;if(reset)progress.setVisibility(View.VISIBLE);String separator=path.contains("?")?"&":"?";String requestPath=path.replaceAll("([?&])page=[^&]*","")+separator+"page="+feedPage;
        api.get(requestPath, (status, data, error) -> { feedLoading=false;progress.setVisibility(View.GONE); if(swipe!=null)swipe.setRefreshing(false);
            if (error != null) { errorView("You appear to be offline.", () -> loadGrid(path)); return; }
            if (status != 200) { errorView(status == 401 ? "Sign in to view this section." : "AniPins could not load this feed.", status == 401 ? this::openLogin : () -> loadGrid(path)); return; }
            JSONArray values=data.optJSONArray("items"); List<Artwork> artwork=new ArrayList<>(); if(values!=null)for(int i=0;i<values.length();i++)artwork.add(new Artwork(values.optJSONObject(i))); if(reset&&path.contains("sort=random")&&!artwork.isEmpty()){if(artwork.size()>1&&artwork.get(0).id==lastRandomFirstId)Collections.rotate(artwork,-1);lastRandomFirstId=artwork.get(0).id;} if(reset)adapter.replace(artwork);else adapter.append(artwork);feedHasMore=data.optBoolean("hasMore",false);if(feedHasMore)feedPage++; if(reset&&artwork.isEmpty())Toast.makeText(this,"No artwork found",Toast.LENGTH_SHORT).show();
        });
    }

    private void checkForNotifications(){
        api.get("/api/notifications?unread=1&limit=1",(status,data,error)->{
            if(status!=200||error!=null||data.optInt("unread",0)<=0)return;
            JSONArray items=data.optJSONArray("notifications"); int artworkId=items!=null&&items.length()>0?items.optJSONObject(0).optInt("artwork_id",0):0;
            if(Build.VERSION.SDK_INT>=26){NotificationManager manager=getSystemService(NotificationManager.class);manager.createNotificationChannel(new NotificationChannel(NOTIFICATION_CHANNEL,"AniPins updates",NotificationManager.IMPORTANCE_DEFAULT));}
            Intent tap=new Intent(this,MainActivity.class); if(artworkId>0)tap.setData(Uri.parse(BuildConfig.API_BASE_URL+"/a/"+artworkId)); tap.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            android.app.PendingIntent pending=android.app.PendingIntent.getActivity(this,artworkId,tap,android.app.PendingIntent.FLAG_UPDATE_CURRENT|(Build.VERSION.SDK_INT>=23?android.app.PendingIntent.FLAG_IMMUTABLE:0));
            android.app.Notification.Builder notification=Build.VERSION.SDK_INT>=26
                ? new android.app.Notification.Builder(this,NOTIFICATION_CHANNEL)
                : new android.app.Notification.Builder(this);
            notification.setSmallIcon(R.drawable.ap_symbol).setContentTitle("AniPins").setContentText(data.optInt("unread",1)+" new notification"+(data.optInt("unread",1)==1?"":"s")).setContentIntent(pending).setAutoCancel(true);
            try{getSystemService(NotificationManager.class).notify(1001,notification.build());}catch(SecurityException ignored){}
        });
    }

    private void checkForUpdate(){api.get("/api/app-version",(status,data,error)->{if(status!=200||error!=null||data.optInt("versionCode")<=BuildConfig.VERSION_CODE)return;String version=data.optString("versionName","new");String apk=data.optString("apk","/downloads/AniPins.apk");new AlertDialog.Builder(this).setTitle("AniPins update available").setMessage("Version "+version+" includes the latest speed, reliability and security improvements.").setNegativeButton("Later",null).setPositiveButton("Update",(dialog,which)->startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(apk.startsWith("http")?apk:BuildConfig.API_BASE_URL+apk)))).show();});}
    private void errorView(String message, Runnable retry) { body.removeAllViews(); LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);panel.setGravity(Gravity.CENTER);panel.setPadding(Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28));TextView text=Ui.text(this,message,16,Ui.FOG,false);text.setGravity(Gravity.CENTER);panel.addView(text);Button button=button("Try again");button.setOnClickListener(v->retry.run());LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,Ui.dp(this,48));p.setMargins(0,Ui.dp(this,18),0,0);panel.addView(button,p);body.addView(panel); }

    private void showSaves() {
        title.setText("Saves");
        title.setText("Saves"); subtitle.setText("Your synced collections"); progress.setVisibility(View.VISIBLE);
        api.get("/api/collections", (status,data,error)->{progress.setVisibility(View.GONE);if(status==401||data.optBoolean("guest")){guestPanel("Sign in to see the same saves and collections as the website.");return;}if(error!=null){errorView("Could not load collections.",this::showSaves);return;}
            ScrollView scroll=new ScrollView(this);LinearLayout content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(Ui.dp(this,16),Ui.dp(this,8),Ui.dp(this,16),Ui.dp(this,24));scroll.addView(content);
            Button create=button("+ Create private collection");create.setOnClickListener(v->createCollection());LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,54));cp.setMargins(0,0,0,Ui.dp(this,14));content.addView(create,cp);
            JSONArray collections=data.optJSONArray("collections");if(collections==null||collections.length()==0)content.addView(Ui.text(this,"No collections yet. Save an artwork to create your first collection.",15,Ui.FOG,false));else for(int i=0;i<collections.length();i++){JSONObject collection=collections.optJSONObject(i);String collectionName=collection.optString("name");int id=collection.optInt("id");Button card=button(collectionName+"  ·  "+collection.optInt("count")+" saves");card.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);card.setOnClickListener(v->showCollection(id,collectionName));card.setOnLongClickListener(v->{new AlertDialog.Builder(this).setTitle("Delete "+collectionName+"?").setMessage("This removes the collection and its saved links.").setNegativeButton("Cancel",null).setPositiveButton("Delete",(dialog,which)->api.delete("/api/collections/"+id,new JSONObject(),(s,d,e)->showSaves())).show();return true;});LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,62));p.setMargins(0,0,0,Ui.dp(this,10));content.addView(card,p);}body.removeAllViews();body.addView(scroll);
        });
    }
    private void createCollection(){EditText input=new EditText(this);input.setHint("Collection name");input.setSingleLine();new AlertDialog.Builder(this).setTitle("New private collection").setView(input).setNegativeButton("Cancel",null).setPositiveButton("Create",(dialog,which)->{String name=input.getText().toString().trim();if(name.isEmpty())return;try{api.post("/api/collections",new JSONObject().put("name",name).put("isPrivate",true),(status,data,error)->{if(status==200)showSaves();else Toast.makeText(this,data.optString("error","Could not create collection"),Toast.LENGTH_LONG).show();});}catch(Exception ignored){}}).show();}
    private void showCollection(int id,String name){title.setText(name);subtitle.setText("Saved on AniPins");currentPath="/api/collections/"+id;body.removeAllViews();body.addView(createGrid());progress.setVisibility(View.VISIBLE);api.get(currentPath,(status,data,error)->{progress.setVisibility(View.GONE);if(swipe!=null)swipe.setRefreshing(false);if(status!=200||error!=null){errorView("Could not load this collection.",this::showSaves);return;}JSONArray values=data.optJSONArray("items");List<Artwork> result=new ArrayList<>();if(values!=null)for(int i=0;i<values.length();i++)result.add(new Artwork(values.optJSONObject(i)));adapter.replace(result);});}

    private void showFollowing() {
        selectNav(2); title.setText("Following"); subtitle.setText("Artwork from characters and anime you follow");
        currentPath = "/api/artworks?sort=following&limit=30";
        showGrid(currentPath);
    }

    /* Legacy saves screen retained for collection access from older callers. */
    private void showFollowingLegacy() {
        selectNav(2); title.setText("Following"); subtitle.setText("Artwork from characters and anime you follow");
        progress.setVisibility(View.VISIBLE);
        api.get("/api/follows", (status,data,error) -> {
            progress.setVisibility(View.GONE);
            if (error != null) { errorView("Could not load following.", this::showFollowing); return; }
            if (status == 401 || data.optBoolean("guest")) { guestPanel("Sign in to follow characters and anime."); return; }
            JSONArray follows = data.optJSONArray("follows");
            if (follows == null || follows.length() == 0) {
                LinearLayout panel = new LinearLayout(this); panel.setOrientation(LinearLayout.VERTICAL); panel.setGravity(Gravity.CENTER); panel.setPadding(Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28));
                panel.addView(Ui.text(this,"Follow characters and anime",20,Ui.PAPER,true));
                TextView copy = Ui.text(this,"Your followed artwork will appear here.",14,Ui.FOG,false); copy.setGravity(Gravity.CENTER); panel.addView(copy);
                Button discover = button("Discover artwork"); discover.setOnClickListener(v->showExplore()); panel.addView(discover);
                body.removeAllViews(); body.addView(panel); return;
            }
            StringBuilder query = new StringBuilder("/api/artworks?sort=latest&limit=30");
            for (int i=0;i<follows.length();i++) { JSONObject f=follows.optJSONObject(i); if (f == null) continue; String kind=f.optString("kind"); String value=f.optString("value"); query.append(i==0 ? "&" : "&"); query.append(kind).append("=").append(Uri.encode(value)); }
            currentPath=query.toString(); showGrid(currentPath);
        });
    }

private void showProfile() { title.setText("Profile"); subtitle.setText("Account and settings"); progress.setVisibility(View.VISIBLE); api.get("/api/auth/me",(status,data,error)->{progress.setVisibility(View.GONE);JSONObject user=data.optJSONObject("user");if(user==null){guestPanel("Sign in to sync saves, likes, follows and collections.");return;}ScrollView scroll=new ScrollView(this);LinearLayout content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(Ui.dp(this,20),Ui.dp(this,18),Ui.dp(this,20),Ui.dp(this,30));TextView name=Ui.text(this,user.optString("nickname",user.optString("name","AniPins user")),26,Ui.PAPER,true);content.addView(name);TextView email=Ui.text(this,user.optString("email"),14,Ui.FOG,false);content.addView(email);addAction(content,"Instagram · @_anipinss_",this::openInstagram);addAction(content,"About AniPins",()->openLegal("About AniPins","/about"));addAction(content,"Help & Support",()->openLegal("Help & Support","/support"));addAction(content,"Privacy Policy",()->openLegal("Privacy Policy","/privacy"));addAction(content,"Terms of Use",()->openLegal("Terms of Use","/terms"));addAction(content,"Copyright / Takedown",()->openLegal("Copyright / Takedown","/copyright"));addAction(content,"Delete Account",()->openLegal("Delete Account","/delete-account"));if("ADMIN".equals(user.optString("role")))addAction(content,"AniPins Admin Dashboard",()->openLegal("AniPins Admin","/admin"));addAction(content,"Sign out",()->{api.post("/api/auth/logout",new JSONObject(),(s,d,e)->{api.session().clear();showProfile();});});TextView version=Ui.text(this,"AniPins "+BuildConfig.VERSION_NAME+" · Native Android",12,Ui.FOG,false);version.setPadding(0,Ui.dp(this,24),0,0);content.addView(version);scroll.addView(content);body.removeAllViews();body.addView(scroll);}); }
    private void addAction(LinearLayout parent,String label,Runnable action){Button button=button(label);button.setGravity(Gravity.START|Gravity.CENTER_VERTICAL);button.setOnClickListener(v->action.run());LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,Ui.dp(this,58));p.setMargins(0,Ui.dp(this,12),0,0);parent.addView(button,p);}
    private void guestPanel(String message){body.removeAllViews();LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);panel.setGravity(Gravity.CENTER);panel.setPadding(Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28),Ui.dp(this,28));TextView text=Ui.text(this,message,16,Ui.FOG,false);text.setGravity(Gravity.CENTER);panel.addView(text);Button login=button("Sign in or create account");login.setOnClickListener(v->openLogin());LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,Ui.dp(this,50));p.setMargins(0,Ui.dp(this,18),0,0);panel.addView(login,p);Button instagram=button("Instagram · @_anipinss_");instagram.setOnClickListener(v->openInstagram());LinearLayout.LayoutParams social=new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,Ui.dp(this,50));social.setMargins(0,Ui.dp(this,12),0,0);panel.addView(instagram,social);body.addView(panel);}
    private void openInstagram(){
        // Prefer Instagram's native profile URI so Android opens the installed app.
        Intent appIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("instagram://user?username=_anipinss_"));
        appIntent.setPackage("com.instagram.android");
        try {
            startActivity(appIntent);
            return;
        } catch (Exception ignored) {
            // Instagram may not be installed or may not expose the native URI.
        }
        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(INSTAGRAM_URL));
        try {
            startActivity(webIntent);
        } catch (Exception ignored) {
            Toast.makeText(this, "Instagram is not available on this device.", Toast.LENGTH_SHORT).show();
        }
    }
    private void openLogin(){startActivity(new Intent(this,LoginActivity.class));}
    private void openLegal(String label,String path){Intent intent=new Intent(this,LegalActivity.class);intent.putExtra("title",label);intent.putExtra("path",path);startActivity(intent);}
    private void openArtwork(Artwork artwork){Intent intent=new Intent(this,ArtworkActivity.class);intent.putExtra("id",artwork.id);startActivity(intent);}

    private void handleDeepLink(Intent intent){
        Uri uri=intent.getData(); if(uri==null)return;
        List<String> parts=uri.getPathSegments();
        if(parts.size()>=2 && "a".equals(parts.get(0))){
            try{Intent art=new Intent(this,ArtworkActivity.class);art.putExtra("id",Integer.parseInt(parts.get(1)));startActivity(art);}catch(NumberFormatException ignored){}
        }
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);handleDeepLink(intent);}
    @Override protected void onResume(){super.onResume(); checkForNotifications(); if(title!=null&&"Profile".contentEquals(title.getText()))showProfile();}
}
