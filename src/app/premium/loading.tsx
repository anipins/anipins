import Image from "next/image";

/** Fast, motion-safe first paint while the private member check completes. */
export default function PremiumLoading() {
  return <main className="premium-loading-grid grid min-h-dvh place-items-center px-6 pt-20">
    <section className="relative grid w-full max-w-md place-items-center overflow-hidden rounded-[2rem] border border-gold/25 bg-panel/85 px-8 py-14 text-center shadow-[0_30px_90px_rgba(0,0,0,.4)]">
      <div className="premium-loading-orbit premium-loading-orbit--outer" />
      <div className="premium-loading-orbit premium-loading-orbit--inner" />
      <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-gold/40 bg-black/45 shadow-[0_0_35px_rgba(198,161,91,.16)]">
        <Image src="/brand/ap-mark-master-v2.png" alt="AniPins" fill priority sizes="80px" className="p-3 object-contain" />
      </div>
      <p className="relative mt-7 text-[11px] font-semibold uppercase tracking-[.3em] text-gold">AniPins Premium</p>
      <p className="relative mt-2 font-display text-2xl text-paper">Opening your private archive</p>
      <div className="relative mt-7 h-px w-32 overflow-hidden bg-gold/20"><span className="premium-loading-scan absolute inset-y-0 w-1/2 bg-gold" /></div>
    </section>
  </main>;
}
