export default function Loading() {
  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8">
      <div className="skeleton h-[42vh] min-h-72 rounded-3xl" />
      <div className="mt-12 masonry" aria-label="Loading artwork">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="skeleton rounded-2xl" style={{ height: 190 + ((index * 73) % 170) }} />
        ))}
      </div>
    </main>
  );
}
