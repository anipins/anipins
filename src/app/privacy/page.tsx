import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy", description: "How AniPins handles data on its website and Android app.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
      <h1 className="font-display text-3xl font-semibold text-paper md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-xs uppercase tracking-widest">Effective September 24, 2026</p>
      <p className="mt-6">This policy covers the AniPins website and Android application, operated independently under the AniPins name. AniPins is an anime-art curation service and is not affiliated with anime publishers or rights holders.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Data we process</h2>
      <p className="mt-3">If you create an account, we store your email address, a one-way password hash, profile name or nickname, optional avatar, cover image and bio, account visibility, notification preferences, and account creation time. If you use Google Sign-In, we verify the Google identity token and store the stable Google account identifier, verified email, display name and profile image supplied for sign-in and account linking. AniPins never receives your Google password.</p>
      <p className="mt-3">We store the collections, saves, likes and anime or character follows you choose. We also process session identifiers and use essential cookies or equivalent local storage so you remain signed in, retain preferences and receive the correct app experience.</p>
      <p className="mt-3">For service operation, safety and recommendations, AniPins records artwork views, downloads and interaction strength, basic page/app events, content reports, takedown requests, and limited technical information such as platform and request timing. Uploaded profile images and administrator-published artwork are stored with the service. Ordinary users cannot publish artwork.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Why and where data is used</h2>
      <p className="mt-3">We use this information to provide accounts, synchronized saves and collections, personalized discovery, follows, download counts, trending pages, abuse prevention, support and legal takedown handling. The Android app stores a protected session token and limited cached thumbnails/recent content on the device. You can clear app storage or the in-app cache.</p>
      <p className="mt-3">AniPins does not use precise location, contacts, call logs, SMS, microphone or background camera data. File access is used only when you deliberately select a profile image or an administrator selects artwork for upload. Device information made available through ordinary web requests may be used for security, compatibility and aggregate performance measurement.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Processors and sharing</h2>
      <p className="mt-3">AniPins uses Vercel for website and API hosting, Supabase infrastructure for the production database and image storage, Google Identity Services for optional Google Sign-In, and Firebase Cloud Messaging for optional Android notifications. These providers may process limited data in the regions where they operate under their own security and privacy commitments. AniPins also records limited first-party operational telemetry, such as page or app events, errors and request timing, to maintain and improve the service.</p>
      <p className="mt-3">We disclose information only to these service providers as necessary to operate AniPins, when you direct us to do so, to investigate abuse or protect the service, or when legally required. The current Android release does not include an advertising SDK. We do not sell personal information or rent user lists.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Security, retention and choices</h2>
      <p className="mt-3">Traffic is encrypted in transit with HTTPS. Passwords are stored only as secure hashes, and privileged service credentials are kept on the server rather than in the website or app. No online service can promise absolute security, but access controls, session protection and administrator safeguards are used to reduce risk.</p>
      <p className="mt-3">Account and profile data is retained while your account exists. Active sessions remain until expiry, sign-out, revocation or account deletion. Cached content remains on a device until it expires or app data is cleared. Operational and security logs are retained only as reasonably needed for reliability, abuse investigation and provider operations. Submitted reports and copyright/takedown records may be retained longer when necessary to document legal compliance or resolve disputes.</p>
      <p className="mt-3">You can edit your profile and notification choices in Settings. You can permanently delete your non-administrator account from website or Android settings, or use the public <Link href="/delete-account" className="text-gold underline">account deletion page</Link>. Deletion removes the account, sessions, push tokens, profile, follows, interactions, likes, saves and collections. Legal takedown records submitted separately are not linked to the deleted account and may be retained where required.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Children’s privacy</h2>
      <p className="mt-3">AniPins is a general-audience artwork discovery service and is not directed to children below the minimum age required to consent to online services in their country. Do not create an account if you cannot legally consent without a parent or guardian. If a parent or guardian believes a child supplied personal information without appropriate permission, contact us so the account and associated data can be reviewed and removed.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Policy updates</h2>
      <p className="mt-3">This policy may be updated when AniPins features, providers or legal obligations change. The effective date above will be revised, and significant changes may also be communicated through the website or app.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Contact</h2>
      <p className="mb-16 mt-3">Questions or privacy requests can be sent to <a href="mailto:anipins01@gmail.com" className="text-gold underline">anipins01@gmail.com</a>.</p>
    </section>
  );
}
