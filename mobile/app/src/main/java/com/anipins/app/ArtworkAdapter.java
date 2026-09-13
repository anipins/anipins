package com.anipins.app;

import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;
import com.bumptech.glide.request.RequestOptions;
import com.bumptech.glide.load.engine.DiskCacheStrategy;

import java.util.ArrayList;
import java.util.List;

final class ArtworkAdapter extends RecyclerView.Adapter<ArtworkAdapter.Holder> {
    interface Listener { void open(Artwork artwork); }
    private final List<Artwork> items = new ArrayList<>();
    private final Listener listener;
    ArtworkAdapter(Listener listener) { this.listener = listener; }
    void replace(List<Artwork> values) { items.clear(); items.addAll(values); notifyDataSetChanged(); }
    void append(List<Artwork> values) { int start=items.size(); for(Artwork value:values){boolean duplicate=false;for(Artwork item:items)if(item.id==value.id){duplicate=true;break;}if(!duplicate)items.add(value);} notifyItemRangeInserted(start,items.size()-start); }
    boolean isEmpty() { return items.isEmpty(); }

    @NonNull @Override public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LinearLayout card = new LinearLayout(parent.getContext()); card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(Ui.background(Ui.PANEL, Ui.dp(parent.getContext(), 18), Color.rgb(43, 43, 43)));
        RecyclerView.LayoutParams params = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        int gap = Ui.dp(parent.getContext(), 6); params.setMargins(gap, gap, gap, gap); card.setLayoutParams(params); card.setClipToOutline(true);
        ImageView image = new ImageView(parent.getContext()); image.setScaleType(ImageView.ScaleType.CENTER_CROP); image.setBackgroundColor(Ui.SOFT);
        card.addView(image, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(parent.getContext(), 250)));
        TextView title = Ui.text(parent.getContext(), "", 14, Ui.PAPER, true); title.setMaxLines(1); title.setGravity(Gravity.START); title.setPadding(gap * 2, gap * 2, gap * 2, 0); card.addView(title);
        TextView meta = Ui.text(parent.getContext(), "", 12, Ui.FOG, false); meta.setMaxLines(1); meta.setPadding(gap * 2, gap, gap * 2, gap * 2); card.addView(meta);
        return new Holder(card, image, title, meta);
    }

    @Override public void onBindViewHolder(@NonNull Holder holder, int position) {
        Artwork artwork = items.get(position); float ratio = artwork.width > 0 && artwork.height > 0 ? (float) artwork.height / artwork.width : 1.3f;
        holder.image.getLayoutParams().height = Ui.dp(holder.image.getContext(), Math.max(190, Math.min(340, 170 * ratio)));
        holder.title.setText(artwork.displayTitle()); holder.meta.setText(artwork.anime);
        holder.itemView.setContentDescription(artwork.displayTitle() + " from " + artwork.anime);
        Glide.with(holder.image).load(artwork.thumbUrl()).apply(new RequestOptions().centerCrop().diskCacheStrategy(DiskCacheStrategy.AUTOMATIC).placeholder(android.R.color.darker_gray)).transition(DrawableTransitionOptions.withCrossFade(140)).into(holder.image);
        if(position+2<items.size()) Glide.with(holder.image).load(items.get(position+2).thumbUrl()).diskCacheStrategy(DiskCacheStrategy.AUTOMATIC).preload();
        holder.itemView.setOnClickListener(view -> listener.open(artwork));
    }
    @Override public int getItemCount() { return items.size(); }

    static final class Holder extends RecyclerView.ViewHolder {
        final ImageView image; final TextView title, meta;
        Holder(View itemView, ImageView image, TextView title, TextView meta) { super(itemView); this.image = image; this.title = title; this.meta = meta; }
    }
}
