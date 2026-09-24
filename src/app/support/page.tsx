import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Help & Support", description: "Get help with AniPins accounts, downloads, artwork and the Android app.", alternates: { canonical: "/support" } };

export default function SupportPage() {
  return <section className="mx-auto max-w-3xl px-6 pt-28 text-sm leading-7 text-fog md:pt-32">
    <p className="text-xs uppercase tracking-[.28em] text-gold">Help & Support</p>
    <h1 className="mt-3 font-display text-4xl font-semibold text-paper">How can we help?</h1>
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Account & collections</h2><p className="mt-2">Sign in with the same email in the website and Android app to keep saves, likes, follows and private collections synchronized.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Downloads</h2><p className="mt-2">Downloaded artwork is saved to your device’s Downloads folder. On Android, watch for the completed-download notification.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Report artwork</h2><p className="mt-2">Open an artwork and use Report. Rights holders can submit a formal request from the <Link href="/copyright" className="text-gold underline">copyright page</Link>.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Android app</h2><p className="mt-2">Use the latest AniPins release for the fastest feed, reliable downloads and current security updates.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Google Sign-In</h2><p className="mt-2">Choose Continue with Google and select an account. If the chooser does not appear, update the AniPins app and Google Play services, confirm internet access, then try again. AniPins never receives your Google password.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Login or session problems</h2><p className="mt-2">Confirm the email address, retry on a stable connection and avoid repeatedly submitting the form. If you use Google Sign-In and email/password with the same verified email, AniPins links them to the same account when permitted.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Download not in Gallery</h2><p className="mt-2">Check the Android Downloads folder and the completed-download notification. Grant notification access if desired. Some gallery apps take a short time to scan a newly downloaded image; reopening the gallery can refresh it.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Administrator uploads</h2><p className="mt-2">Only administrators can publish artwork. Use the dashboard upload page, provide accurate character and series information, and keep the app open until every selected file completes. Do not upload material you are not authorized to share.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">Delete your account</h2><p className="mt-2">Open Profile → Settings &amp; privacy → Delete account, or use the public <Link href="/delete-account" className="text-gold underline">deletion page</Link>. Deletion removes the account and associated profile activity permanently.</p></article>
      <article className="rounded-2xl border border-paper/10 bg-soft p-5"><h2 className="font-display text-lg text-paper">App updates</h2><p className="mt-2">Website features update automatically inside the app. Native Android changes such as launcher icons, permissions or sign-in components require installing the latest signed AniPins update.</p></article>
    </div>
    <p className="mb-16 mt-8">Still need help? Email <a className="text-gold underline" href="mailto:anipins01@gmail.com">anipins01@gmail.com</a> or message <a className="text-gold underline" href="https://www.instagram.com/_anipinss_/" target="_blank" rel="noopener noreferrer">@_anipinss_ on Instagram</a>. Include the page or artwork URL, your device model and a screenshot when possible. Please allow a reasonable time for a response.</p>
  </section>;
}
