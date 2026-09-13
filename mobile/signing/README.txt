AniPins release signing
=======================

The project never stores signing passwords in source control.

To create a signed release build, set these environment variables before running Gradle:

ANIPINS_KEYSTORE_PATH=/absolute/path/to/anipins-upload-key.jks
ANIPINS_KEYSTORE_PASSWORD=...
ANIPINS_KEY_ALIAS=anipins-upload
ANIPINS_KEY_PASSWORD=...

Then run:
  gradle bundleRelease

For Google Play, enable Play App Signing. Treat this upload key and its password as confidential.
