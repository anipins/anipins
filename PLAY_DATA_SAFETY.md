# Google Play Data Safety draft

This draft reflects the source and libraries in AniPins Android 2.0.2. Recheck the final Play Console definitions before submission.

## SDK audit

- AndroidX RecyclerView and SwipeRefreshLayout: UI only.
- Glide: image loading and local app-cache management; no analytics/advertising SDK.
- Android platform `DownloadManager`, `HttpURLConnection`, Android Keystore and system share/file pickers.
- No ads SDK, analytics SDK, location SDK, contacts, camera, microphone, SMS, phone or push SDK in the release.

## Data declarations

| Data type | Collected | Shared | Required | Purpose / retention |
|---|---:|---:|---:|---|
| Email address | Yes when account is used | No* | Account feature only | Authentication and support; retained until account deletion |
| Name/nickname | Optional | No* | No | Profile; retained until edited or account deletion |
| User IDs/session token | Yes | No* | Account feature only | Authentication and fraud/security; session expires or is deleted on logout/account deletion |
| App interactions | Yes | No* | Core feed metrics | Views, likes, saves, follows and downloads; per-user records deleted with account, aggregate counters remain anonymous |
| User content | Optional | No* | No | Profile avatar/cover/bio and collections; removed with account or user action |
| Diagnostics | Limited server request/operational logs | No* | Core operation | Reliability, abuse prevention and support; infrastructure retention applies |
| Files/photos | User-selected only for owner admin workflow | No* | No | Administrator artwork upload or optional profile images; stored until removed |

`No*` means not sold or transferred to unrelated third parties. Vercel (hosting/API) and Supabase (database/image storage) process data as service providers. Confirm whether Google Play's current “service provider” exception applies when answering the live form.

All network traffic uses HTTPS. The Android session token is encrypted with Android Keystore. Passwords are sent only to the AniPins API over HTTPS and are stored server-side as one-way hashes. Users can request full account deletion in-app or at `https://anipins-three.vercel.app/delete-account`.

## Play Console answers to verify

- Data is encrypted in transit: Yes.
- Users can request deletion: Yes.
- App follows Families policy: do not select a child-directed audience without a separate content audit.
- Independent security review: do not claim one unless completed.
