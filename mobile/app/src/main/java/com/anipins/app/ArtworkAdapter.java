package com.anipins.app;

import android.graphics.Color;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
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
    void clear() { int count = items.size(); items.clear(); if (count > 0) notifyItemRangeRemoved(0, count); }
    void append(List<Artwork> values) { int start=items.size(); for(Artwork value:values){boolean duplicate=false;for(Artwork item:items)if(item.id==value.id){duplicate=true;break;}if(!duplicate)items.add(value);} int added=items.size()-start; if(added>0) notifyItemRangeInserted(start,added); }
    boolean isEmpty() { return items.isEmpty(); }

    @NonNull @Override public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LinearLayout card = new LinearLayout(parent.getContext()); card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(Ui.background(Ui.PANEL, Ui.dp(parent.getContext(), 21), Color.rgb(43, 43, 43)));
        RecyclerView.LayoutParams params = new RecyclerView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        int gap = Ui.dp(parent.getContext(), 8); params.setMargins(gap, gap, gap, gap); card.setLayoutParams(params); card.setClipToOutline(true); card.setHasTransientState(false);
        ImageView image = new ImageView(parent.getContext()); image.setScaleType(ImageView.ScaleType.CENTER_CROP); image.setBackgroundColor(Ui.SOFT);
        card.addView(image, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(parent.getContext(), 220)));
        TextView title = Ui.text(parent.getContext(), "", 15, Ui.PAPER, true); title.setMaxLines(1); title.setGravity(Gravity.START); title.setPadding(gap * 2, gap * 2, gap * 2, 0); card.addView(title);
        TextView meta = Ui.text(parent.getContext(), "", 12.5f, Ui.FOG, false); meta.setMaxLines(1); meta.setPadding(gap * 2, gap, gap * 2, gap * 2); card.addView(meta);
        return new Holder(card, image, title, meta);
    }

    @Override public void onBindViewHolder(@NonNull Holder holder, int position) {
        Artwork artwork = items.get(position); float ratio = artwork.width > 0 && artwork.height > 0 ? (float) artwork.height / artwork.width : 1.3f;
        ViewGroup.LayoutParams imageParams = holder.image.getLayoutParams();
        imageParams.height = Ui.dp(holder.image.getContext(), Math.max(180, Math.min(390, 172 * ratio)));
        holder.image.setLayoutParams(imageParams);
        holder.title.setText(artwork.displayTitle()); holder.meta.setText(artwork.anime);
        holder.itemView.setContentDescription(artwork.displayTitle() + " from " + artwork.anime);
        Glide.with(holder.image).load(artwork.thumbUrl()).apply(new RequestOptions().centerCrop().diskCacheStrategy(DiskCacheStrategy.AUTOMATIC).dontAnimate().placeholder(android.R.color.darker_gray)).into(holder.image);
        if(position+2<items.size()) Glide.with(holder.image).load(items.get(position+2).thumbUrl()).diskCacheStrategy(DiskCacheStrategy.AUTOMATIC).preload();
        holder.itemView.setOnClickListener(view -> { view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK); view.animate().scaleX(.97f).scaleY(.97f).setDuration(70).withEndAction(() -> { view.animate().scaleX(1f).scaleY(1f).setDuration(110).start(); listener.open(artwork); }).start(); });
    }
    @Override public int getItemCount() { return items.size(); }

    static final class Holder extends RecyclerView.ViewHolder {
        final ImageView image; final TextView title, meta;
        Holder(View itemView, ImageView image, TextView title, TextView meta) { super(itemView); this.image = image; this.title = title; this.meta = meta; }
    }
}
