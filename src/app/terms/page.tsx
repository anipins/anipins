import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Use", description: "Rules and conditions for using the AniPins website and Android app.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-16 pt-28 text-sm leading-7 text-fog md:pt-32">
      <h1 className="font-display text-3xl font-semibold md:text-4xl text-paper">Terms of Use</h1>
      <p className="mt-2 text-xs uppercase tracking-widest">Effective September 24, 2026</p>
      <p className="mt-6">These terms apply to the AniPins website and Android application. By accessing or using AniPins, you agree to these terms. If you do not agree, do not use the service.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Service and eligibility</h2>
      <p className="mt-3">AniPins is an independent platform for discovering, organizing, saving and downloading anime and manhua artwork. It is not affiliated with anime studios, publishers, character owners or other rights holders. You must be legally capable of agreeing to these terms. A parent or guardian should supervise use by anyone who cannot legally consent on their own.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Accounts and security</h2>
      <p className="mt-3">You are responsible for providing accurate account information, protecting your login credentials and activity performed through your account. Do not impersonate another person, create accounts to evade restrictions, attempt to access another account or interfere with AniPins security. Notify us promptly if you believe your account has been compromised.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Acceptable use</h2>
      <p className="mt-3">You may use AniPins for lawful personal discovery and collection purposes. You must not scrape the service at unreasonable volume, bypass technical controls, distribute malware, probe for vulnerabilities, automate fake views or downloads, harass users, submit false reports, or use AniPins in a way that violates applicable law or another person’s rights.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Artwork and intellectual property</h2>
      <p className="mt-3">Anime characters, source material, artwork and related marks remain the property of their respective creators and rights holders. Availability on AniPins does not transfer ownership or grant commercial-use rights. Downloads are intended for personal reference unless the relevant rights holder grants broader permission. Do not resell, falsely claim authorship of, or commercially exploit downloaded material without permission.</p>
      <p className="mt-3">Only authorized administrators may publish artwork. Anyone supplying content or information to AniPins must have the right to do so and must not knowingly provide unlawful, infringing or deceptive material. Rights holders can request review or removal through the <Link href="/copyright" className="text-gold underline">Copyright / Content Removal page</Link>.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Profiles, reports and moderation</h2>
      <p className="mt-3">Profile names, images and bios must not be illegal, abusive, sexually exploitative, hateful, deceptive or infringing. AniPins may remove content, restrict features, suspend accounts or preserve relevant records when reasonably necessary for safety, legal compliance, abuse prevention or enforcement of these terms.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Availability and changes</h2>
      <p className="mt-3">AniPins may add, modify or discontinue features, update these terms, correct artwork information, or temporarily interrupt access for maintenance, security or circumstances outside our control. Material changes will be reflected by an updated effective date. Continued use after an update means you accept the revised terms.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Disclaimers and responsibility</h2>
      <p className="mt-3">AniPins is provided on an “as available” basis without guarantees that every image, label, link or feature will always be accurate, available or error-free. To the extent permitted by applicable law, AniPins is not responsible for indirect, incidental or consequential loss arising from use of the service, third-party content, external links or unauthorized use of downloaded artwork. Nothing in these terms excludes rights or liabilities that cannot legally be excluded.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Termination and deletion</h2>
      <p className="mt-3">You may stop using AniPins at any time and delete your account through Settings or the public <Link href="/delete-account" className="text-gold underline">account-deletion page</Link>. AniPins may restrict or terminate access for serious or repeated violations. Provisions concerning intellectual property, disclaimers, legal compliance and records that must reasonably survive will continue after termination.</p>

      <h2 className="mt-8 font-display text-xl font-semibold text-paper">Applicable law and contact</h2>
      <p className="mt-3">These terms are governed by applicable laws and mandatory consumer protections in the relevant jurisdiction. Questions about these terms can be sent to <a href="mailto:anipins01@gmail.com" className="text-gold underline">anipins01@gmail.com</a>.</p>
    </section>
  );
}
