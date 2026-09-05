'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('uploads');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setCurrentUser(d.user));
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [username]);

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border-2 border-[#D4AF37]/30 flex items-center justify-center">
              <span className="text-[#D4AF37] text-3xl font-bold">{username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{username}</h1>
              <p className="text-gray-500 text-sm">@{username}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-white/5">
            {['uploads', 'saved', 'collections', 'liked'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-gray-500 hover:text-white'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'uploads' && (
            <MasonryGrid limit={30} />
          )}

          {activeTab !== 'uploads' && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">{activeTab === 'saved' ? '🔖' : activeTab === 'collections' ? '📁' : '❤️'}</div>
              <h3 className="text-lg font-semibold mb-2">No {activeTab} yet</h3>
              <p className="text-gray-500 text-sm">
                {isOwnProfile ? `Your ${activeTab} will appear here` : `This user's ${activeTab} will appear here`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
