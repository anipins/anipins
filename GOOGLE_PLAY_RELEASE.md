# Google Play release checklist

1. Confirm the Play Console target-SDK requirement; AniPins currently compiles and targets API 36.
2. Create the app with package ID `com.anipins.app` and enroll in Play App Signing.
3. Upload `release/AniPins-2.0.0.aab` to an internal test track.
4. Add the listing copy and graphics from `PLAY_STORE_LISTING.md` and `play-store-assets/`.
5. Capture phone screenshots using the documented plan.
6. Set privacy URL to `https://anipins-three.vercel.app/privacy`.
7. Set account-deletion URL to `https://anipins-three.vercel.app/delete-account`.
8. Complete Data Safety from `PLAY_DATA_SAFETY.md` after checking the final artifact and live Play definitions.
9. Complete target audience/content rating from `PLAY_CONTENT_RATING_GUIDE.md` after a catalog audit.
10. Complete App access instructions with a non-owner test account if review needs signed-in saves.
11. Complete ads declaration (the current build contains no ads), content declarations and support contact.
12. Test install, launch, login/logout, randomized refresh, search, artwork zoom, like/save, collections, download, share, deletion page, offline retry and an `/a/{id}` App Link.
13. Personal developer accounts created after November 13, 2023 may need a closed test with at least 12 opted-in testers continuously for 14 days before production access; follow the requirement shown in the account's Play Console.
14. Promote only after pre-launch reports and policy checks pass.

Local outputs:

- Sideload APK: `release/AniPins-2.0.0.apk`
- Play upload bundle: `release/AniPins-2.0.0.aab`
- Website APK: `public/downloads/AniPins.apk`
