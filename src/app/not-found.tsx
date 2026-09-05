import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl mb-6">🎨</div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist. It might have been moved or deleted.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="px-6 py-3 rounded-full bg-[#D4AF37] text-black font-semibold hover:bg-[#C6A15B] transition-colors">
            Go Home
          </Link>
          <Link href="/explore" className="px-6 py-3 rounded-full bg-white/10 font-medium hover:bg-white/20 transition-colors">
            Explore
          </Link>
        </div>
      </div>
    </div>
  );
}
