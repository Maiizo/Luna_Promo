'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';

// Syntax Error Fixed: Menambahkan kurung kurawal penutup
interface Voucher {
  id: string;
  code: string;
  customer_id: string;
  discount_type: string;
  status: 'active' | 'redeemed' | 'expired';
  created_at: string;
  customers?: { email: string | null; name: string };
}

export default function History() {
  const [session, setSession] = useState<Session | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [redeemCode, setRedeemCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/');
      else {
        setSession(session);
        fetchVouchers();
      }
    });
  }, [router]);

  // Fixed: Join query ke tabel customers untuk mengambil email
  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*, customers(email, name)')
      .order('created_at', { ascending: false });
    if (!error && data) setVouchers(data as any);
  };

  // Fixed: Menggunakan format diskon Olsera
  const formatDiscountLabel = (type: string) => {
    if (type === '50k_discount') return 'Diskon Rp 50.000';
     if (type === '20k_discount') return 'Diskon Rp 20.000';
   
    if (type === 'free_sample') return 'Free Sample';
    return 'Tidak diketahui';
  };

  const processRedeem = async (code: string) => {
    if (!code.trim()) return;
    setIsRedeeming(true);
    
    // FIX: Remove prefixes like '50K-', '20K-', or 'SAMPLE-' before checking the database
    const cleanCode = code.trim().split('-').pop() || code.trim();

    const { data: voucherData, error: fetchError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', cleanCode) // Use the cleaned code here
      .single(); 

    if (fetchError || !voucherData) {
      alert('Voucher tidak ditemukan');
      setIsRedeeming(false);
      return;
    }
    
    if (voucherData.status === 'redeemed' || voucherData.status === 'expired') {
      alert(`Voucher tidak bisa digunakan (Status: ${voucherData.status})`);
      setIsRedeeming(false);
      return;
    }
    
    const { error: updateError } = await supabase
      .from('vouchers')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', voucherData.id);
      
    if (updateError) {
      alert('Gagal menggunakan voucher: ' + updateError.message);
    } else {
      alert('Voucher berhasil digunakan!');
      setRedeemCode('');
      setShowScanner(false);
      await fetchVouchers();
    }
    setIsRedeeming(false);
  };

  const handleRedeem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await processRedeem(redeemCode);
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Riwayat Voucher</h1>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/');
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Sisi Kiri: Scanner (Tidak Diubah) */}
          <div className="space-y-6">
            <form onSubmit={handleRedeem} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Gunakan Voucher</h2>
                <button type="button" onClick={() => setShowScanner(!showScanner)} className="rounded-lg bg-slate-100 p-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
                  {showScanner ? 'Tutup Scanner' : 'Buka Scanner'}
                </button>
              </div>
              
              {showScanner && (
                <div className="mb-6 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                  <Scanner
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        const code = result[0].rawValue;
                        setRedeemCode(code);
                        processRedeem(code);
                      }
                    }}
                  />
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Masukkan kode..."
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isRedeeming || !redeemCode}
                  className="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {isRedeeming ? 'Memproses...' : 'Gunakan'}
                </button>
              </div>
            </form>
          </div>

          {/* Sisi Kanan: Tabel History */}
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Semua Voucher</h2>
              <button onClick={fetchVouchers} className="text-sm font-medium text-slate-600 hover:text-slate-900">Refresh</button>
            </div>

            <div className="flow-root">
              <ul role="list" className="-my-4 divide-y divide-slate-200">
                {vouchers.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-x-6 py-4">
                    <div className="min-w-0">
                      <div className="flex items-start gap-x-3">
                        <p className="text-sm font-semibold leading-6 text-slate-900">{v.customers?.name || 'No Name'}</p>
                        <p
                          className={`rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            v.status === 'active'
                              ? 'text-green-700 bg-green-50 ring-green-600/20'
                              : 'text-red-700 bg-red-50 ring-red-600/20'
                          }`}
                        >
                          {v.status}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                        <p className="whitespace-nowrap font-mono">{v.code}</p>
                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                        <p className="truncate">{v.customers?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-x-4">
                      <p className="text-sm font-medium text-slate-700 text-right">{formatDiscountLabel(v.discount_type)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}