import type { Metadata } from "next";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export const metadata: Metadata = { title: "Delete Your AniPins Account", description: "Permanently delete an AniPins website and Android app account and its associated data.", alternates: { canonical: "/delete-account" } };

export default function DeleteAccountPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 pb-16 pt-28 md:pt-32">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Account control</p>
      <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">Delete your AniPins account</h1>
      <p className="mt-5 text-sm leading-7 text-fog">This page works for accounts created on the AniPins website or Android app. Deletion is permanent and removes your profile, login sessions, push tokens, follows, interaction history, likes, saves and collections. It does not remove anonymized aggregate artwork counters or separately submitted legal takedown records.</p>
      <p className="mt-3 text-sm leading-7 text-fog">You can also use <strong className="text-paper">Profile → Settings & privacy → Delete account</strong> inside AniPins. Administrator accounts require owner support so the service cannot accidentally lose its only administrator.</p>
      <DeleteAccountForm />
      <p className="mt-6 text-xs leading-6 text-fog">If you cannot access your account, email <a href="mailto:anipins01@gmail.com" className="text-gold underline">anipins01@gmail.com</a> from the account email address for assistance.</p>
    </section>
  );
}
