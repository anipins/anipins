package com.anipins.app;

import org.json.JSONObject;

final class Artwork {
    final int id, width, height;
    final String title, character, characterSlug, anime, animeSlug, thumb, original, description, tags, gender;

    Artwork(JSONObject value) {
        id = value.optInt("id"); width = value.optInt("width"); height = value.optInt("height");
        title = value.optString("title"); character = value.optString("character_name"); characterSlug = value.optString("character_slug");
        anime = value.optString("anime_name"); animeSlug = value.optString("anime_slug"); thumb = value.optString("thumb"); original = value.optString("orig", thumb);
        description = value.optString("description"); tags = value.optString("tags"); gender = value.optString("gender");
    }
    String displayTitle() { return title.isEmpty() ? character : title; }
    String thumbUrl() { return BuildConfig.API_BASE_URL + "/api/img/" + thumb; }
    String originalUrl() { return BuildConfig.API_BASE_URL + "/api/img/" + original; }
    String webUrl() { return BuildConfig.API_BASE_URL + "/a/" + id; }
}
