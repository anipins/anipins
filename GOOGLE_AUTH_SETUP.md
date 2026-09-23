# AniPins Google Sign-In setup

AniPins uses Google Identity Services (GIS) to obtain an ID token in the browser. The token is sent to AniPins and verified server-side with `google-auth-library`; Google access tokens and client secrets are not stored.

## Google Auth Platform

1. Open Google Cloud Console → Google Auth Platform.
2. Configure Branding and Audience. Add `anipins.com` as an authorized domain.
3. Keep the requested scopes to `openid`, `email`, and `profile`.
4. Create an OAuth client with application type **Web application**.
5. Add these **Authorized JavaScript origins**:
   - `https://anipins.com`
   - `https://www.anipins.com` (only if this hostname is enabled)
   - `http://localhost:3000` for local development
6. Create an **Android application OAuth client in the same Google Cloud project** used by the Web client. Use:
   - Package name: `com.anipins.app`
   - Release APK SHA-1: `3D:46:9A:90:11:AE:FF:72:6C:25:7A:2B:04:22:C9:30:FA:19:DC:A4`
   
   The Android client is required for Credential Manager to recognize the signed Android app. The Android implementation still uses the Web client ID as the `serverClientId`.

This GIS ID-token flow does not use a redirect URI or client secret.

## Environment variables

Set both variables to the OAuth Web client ID. It is a public identifier, not a secret.

```env
GOOGLE_CLIENT_ID=000000000000-example.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=000000000000-example.apps.googleusercontent.com
```

On Vercel, add both variables to Production and Preview as needed, then redeploy so the public value is included in the browser bundle.

## Database migration

Run `scripts/migrations/20260921_google_identity.sql` against the production PostgreSQL database before enabling the button. The application also creates the table defensively on first Google sign-in.

## Verification checklist

- Sign in with a new verified Google account: a normal AniPins user and session are created.
- Sign in with an existing AniPins email: the verified Google identity links to that account.
- Sign in again after changing the Google email: the same account is found by Google's stable `sub` value.
- An AniPins administrator with 2FA enabled is still asked for the existing TOTP/recovery code.
- Sign out and sign back in to confirm the normal `anipins_session` lifecycle is used.
