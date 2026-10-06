import AdminUpload from "../upload/page";

export const metadata = { title: "Premium Library Upload | AniPins Admin" };

export default function PremiumUploadPage() {
  return (
    <section>
      <div className="mb-8 rounded-3xl border border-gold/25 bg-gradient-to-br from-[#221a0c] via-panel to-panel p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.26em] text-gold">Member library</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-paper sm:text-4xl">Upload Premium artwork</h1>
        <p className="mt-3 max-w-2xl leading-7 text-fog">This is a separate publishing route. Every upload is locked to AniPins Premium and never joins the public Home, Explore, search, gallery, wallpaper, character, or anime feeds.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-gold">Admins have full access</span><span className="rounded-full border border-paper/10 px-3 py-1.5 text-fog">Members need an active subscription</span><span className="rounded-full border border-paper/10 px-3 py-1.5 text-fog">Names and series are optional</span></div>
      </div>
      <AdminUpload premiumOnly />
    </section>
  );
}
