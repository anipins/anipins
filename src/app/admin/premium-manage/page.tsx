import AdminManage from "../manage/page";

export const metadata = { title: "Premium Artwork Manager | AniPins Admin" };

export default function PremiumManagePage() {
  return (
    <section>
      <div className="mb-8 rounded-3xl border border-gold/25 bg-gradient-to-br from-[#221a0c] via-panel to-panel p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[.26em] text-gold">Member library</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-paper sm:text-4xl">Premium artwork manager</h1>
        <p className="mt-3 max-w-2xl leading-7 text-fog">Manage only member-only uploads here: publish, feature in the Premium carousel, edit, download, or remove them. Public artwork is intentionally not shown.</p>
      </div>
      <AdminManage premiumOnly />
    </section>
  );
}
