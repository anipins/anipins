import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy", description: "How AniPins handles data on its website and Android app.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
      <h1 className="font-display text-3xl font-semibold text-paper md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-xs uppercase tracking-widest">Effective September 10, 2026</p>
      <p className="mt-6">This policy covers the AniPins website and the AniPins Android application. AniPins is an independent anime-art curation service and is not affiliated with anime publishers or rights holders.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Data we process</h2>
      <p className="mt-3">If you create an account, we store your email address, a one-way password hash, profile name or nickname, optional avatar, cover image and bio, account visibility, notification preferences, and account creation time. We store the collections, saves, likes and anime or character follows you choose. We also process session identifiers so you remain signed in.</p>
      <p className="mt-3">For service operation, safety and recommendations, AniPins records artwork views, downloads and interaction strength, basic page/app events, content reports, takedown requests, and limited technical information such as platform and request timing. Uploaded profile images and administrator-published artwork are stored with the service. Ordinary users cannot publish artwork.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Why and where data is used</h2>
      <p className="mt-3">We use this information to provide accounts, synchronized saves and collections, personalized discovery, follows, download counts, trending pages, abuse prevention, support and legal takedown handling. The Android app stores a protected session token and limited cached thumbnails/recent content on the device. You can clear app storage or the in-app cache.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Processors and sharing</h2>
      <p className="mt-3">AniPins uses Vercel for website and API hosting, Supabase infrastructure for the production database and image storage, and Firebase Cloud Messaging to deliver optional Android notifications. AniPins also records limited first-party operational telemetry, such as page or app events, errors and request timing, to maintain and improve the service. The current Android release does not include an advertising SDK. We do not sell personal information or rent user lists.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Security, retention and choices</h2>
      <p className="mt-3">Traffic is encrypted in transit with HTTPS. Passwords are stored only as secure hashes, and privileged service credentials are kept on the server rather than in the website or app. Account data is retained while your account exists. Operational logs may remain for a limited period under infrastructure-provider retention. Submitted copyright/takedown records may be retained when necessary to document legal compliance.</p>
      <p className="mt-3">You can edit your profile and notification choices in Settings. You can permanently delete your non-administrator account from website or Android settings, or use the public <Link href="/delete-account" className="text-gold underline">account deletion page</Link>. Deletion removes the account, sessions, push tokens, profile, follows, interactions, likes, saves and collections. Legal takedown records submitted separately are not linked to the deleted account and may be retained where required.</p>
      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Contact</h2>
      <p className="mb-16 mt-3">Questions or privacy requests can be sent to <a href="mailto:anipins01@gmail.com" className="text-gold underline">anipins01@gmail.com</a>.</p>
    </section>
  );
}
