const cardHeights = ["h-64", "h-80", "h-56", "h-72", "h-60", "h-96", "h-64", "h-80", "h-56", "h-72", "h-64", "h-80"];

export default function Loading() {
  return (
    <section role="status" aria-label="Loading page" className="mx-auto min-h-[70vh] max-w-[1800px] px-3 pb-10 pt-24 sm:px-4 md:px-6 md:pt-28 xl:px-8">
      <span className="sr-only">Opening AniPins…</span>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="skeleton h-8 w-40 max-w-[50vw] rounded-lg" />
          <div className="skeleton h-4 w-72 max-w-[75vw] rounded-md" />
        </div>
        <div className="skeleton hidden h-10 w-32 rounded-full sm:block" />
      </div>
      <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {cardHeights.map((height, index) => (
          <div key={index} className={`skeleton ${height} rounded-xl sm:rounded-2xl`} />
        ))}
      </div>
    </section>
  );
}
