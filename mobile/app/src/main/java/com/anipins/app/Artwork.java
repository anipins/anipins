package com.anipins.app;

import org.json.JSONObject;

final class Artwork {
    final int id, width, height;
    final String title, character, characterSlug, anime, animeSlug, thumb, original, thumbDirect, originalDirect, description, tags, gender;

    Artwork(JSONObject value) {
        id = value.optInt("id"); width = value.optInt("width"); height = value.optInt("height");
        title = value.optString("title"); character = value.optString("character_name"); characterSlug = value.optString("character_slug");
        anime = value.optString("anime_name"); animeSlug = value.optString("anime_slug"); thumb = value.optString("thumb"); original = value.optString("orig", thumb);
        thumbDirect = value.optString("thumb_url"); originalDirect = value.optString("original_url");
        description = value.optString("description"); tags = value.optString("tags"); gender = value.optString("gender");
    }
    String displayTitle() { return title.isEmpty() ? character : title; }
    String thumbUrl() { return thumbDirect.isEmpty() ? BuildConfig.API_BASE_URL + "/api/img/" + thumb : absolute(thumbDirect); }
    String originalUrl() { return originalDirect.isEmpty() ? BuildConfig.API_BASE_URL + "/api/img/" + original : absolute(originalDirect); }
    private String absolute(String value) { return value.startsWith("/") ? BuildConfig.API_BASE_URL + value : value; }
    String webUrl() { return BuildConfig.API_BASE_URL + "/a/" + id; }
}
