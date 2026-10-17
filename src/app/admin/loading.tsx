export default function AdminLoading() {
  return (
    <div aria-label="Loading admin page" role="status" className="mx-auto flex min-h-[70vh] max-w-[1560px] gap-6 px-4 pt-24 md:px-6">
      <aside className="hidden w-64 shrink-0 space-y-3 border-r border-paper/[0.07] pr-5 md:block">
        <div className="skeleton h-12 rounded-xl" />
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton h-10 rounded-xl" />)}
      </aside>
      <main className="min-w-0 flex-1 space-y-5 py-8">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-[45vh] rounded-2xl" />
      </main>
    </div>
  );
}
