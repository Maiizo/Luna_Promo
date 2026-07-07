'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';

export default function CashierDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  // Pastikan hanya kasir yang login yang bisa melihat halaman ini
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setSession(session);
    });
  }, [router]);

  if (!session) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="p-8 max-w-md mx-auto text-center mt-10">
      <h1 className="text-3xl font-bold mb-2 text-white">Dashboard </h1>
      <br></br>
      <div className="grid grid-cols-1 gap-4">
        {/* Tombol untuk Buka Scanner */}
        <Link 
          href="/cashier/scan" 
          className="flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-xl transition-all"
        >
          <span className="font-bold text-xl">Buka Scanner</span>
        </Link>

        {/* Tombol untuk Riwayat */}
        <Link 
          href="/history" 
          className="flex flex-col items-center justify-center bg-slate-600 hover:bg-slate-700 text-white p-6 rounded-2xl shadow-xl transition-all"
        >
          <span className="font-bold text-xl">History</span>
        </Link>
      </div>

      <button 
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
        className="mt-12 text-sm text-red-500 font-bold hover:underline"
      >
        Keluar (Logout)
      </button>
    </div>
  );
}