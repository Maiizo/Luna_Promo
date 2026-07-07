'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';

interface DiscountTier {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
}

interface Voucher {
  id: string;
  code: string;
  tier_id: string;
  platform: string;
  status: 'dispensed' | 'redeemed' | 'used';
  customer_email: string | null;
  created_at: string;
}

export default function History() {
  const [session, setSession] = useState<Session | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [tiers, setTiers] = useState<DiscountTier[]>([]);
  const [redeemCode, setRedeemCode] = useState<string>('');
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        fetchTiers();
        fetchVouchers();
      }
    });
  }, [router]);

  const fetchTiers = async () => {
    const { data, error } = await supabase.from('discount_tiers').select('*');
    if (!error && data) setTiers(data as DiscountTier[]);
  };

  const fetchVouchers = async () => {
    const { data, error } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
    if (!error && data) setVouchers(data as Voucher[]);
  };

  const formatDiscountLabel = (tier: DiscountTier) => {
    if (tier.discount_type === 'percentage') return `${tier.discount_value}% diskon`;
    return `Rp${tier.discount_value} diskon`;
  };

  const processRedeem = async (code: string) => {
    if (!code.trim()) return;

    setIsRedeeming(true);

    const { data: voucherData, error: fetchError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.trim())
      .select();

    if (fetchError || !voucherData) {
      alert('Voucher tidak ditemukan');
      setIsRedeeming(false);
      return;
    }

    if (voucherData.status === 'redeemed' || voucherData.status === 'used') {
      alert('Voucher sudah pernah digunakan');
      setIsRedeeming(false);
      return;
    }

    // Menggunakan 'redeemed' sebagai status berdasarkan asumsi check constraint
    const { error: updateError } = await supabase
      .from('vouchers')
      .update({ status: 'redeemed' })
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
          <Link href="/" className="inline-flex rounded-xl bg-slate-200 px-4 py-2 font-medium text-slate-800 hover:bg-slate-300">
            &larr; Kembali ke Buat Voucher
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <form onSubmit={handleRedeem} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Gunakan Voucher</h2>
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="rounded-lg bg-slate-100 p-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
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

              <p className="mt-1 mb-4 text-sm text-slate-500">Scan QR atau masukkan kode secara manual untuk memverifikasi.</p>
              
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Masukkan kode (mis. PET-ABC123)"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={redeemCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRedeemCode(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isRedeeming || !redeemCode}
                  className={`rounded-2xl px-6 py-3 text-base font-bold text-white transition ${
                    isRedeeming || !redeemCode
                      ? 'cursor-not-allowed bg-slate-400'
                      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                  }`}
                >
                  {isRedeeming ? 'Memproses...' : 'Gunakan'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Semua Voucher</h2>
              <button 
                onClick={fetchVouchers} 
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Diskon</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => {
                    const tier = tiers.find(t => t.id === v.tier_id);
                    const isUsed = v.status === 'redeemed' || v.status === 'used';
                    return (
                      <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50 last:border-0">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{v.code}</td>
                        <td className="px-4 py-3">{v.customer_email || '-'}</td>
                        <td className="px-4 py-3">{tier ? formatDiscountLabel(tier) : 'Tidak diketahui'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            isUsed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {isUsed ? 'Sudah Dipakai' : 'Tersedia'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setViewingVoucher(v)}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {vouchers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        Belum ada voucher yang dibuat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {viewingVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
              <button
                onClick={() => setViewingVoucher(null)}
                className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
              >
                Tutup
              </button>
              <h3 className="mb-4 text-xl font-bold text-slate-900">Detail Voucher</h3>
              
              <div className="mb-4 flex justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100" id="qr-modal-container">
                <QRCodeCanvas value={viewingVoucher.code} size={200} level="H" includeMargin={true} />
              </div>
              
              <button
                onClick={() => {
                  const canvas = document.querySelector('#qr-modal-container canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Voucher-${viewingVoucher.code}.png`;
                    link.click();
                  }
                }}
                className="mb-4 rounded-xl bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-300"
              >
                Unduh QR Code
              </button>

              <p className="text-3xl font-mono font-bold tracking-wider text-slate-900">{viewingVoucher.code}</p>
              
              <div className="mt-4 space-y-2 text-left text-sm text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-semibold text-slate-900">Status</span>
                  <span className={`font-medium ${viewingVoucher.status === 'redeemed' || viewingVoucher.status === 'used' ? 'text-red-600' : 'text-green-600'}`}>
                    {viewingVoucher.status === 'redeemed' || viewingVoucher.status === 'used' ? 'Sudah Dipakai' : 'Tersedia'}
                  </span>
                </div>
                {viewingVoucher.customer_email && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-900">Email</span>
                    <span className="truncate pl-4">{viewingVoucher.customer_email}</span>
                  </div>
                )}
                {viewingVoucher.created_at && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-900">Dibuat</span>
                    <span>{new Date(viewingVoucher.created_at).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {viewingVoucher.status === 'dispensed' && (
                <button
                  onClick={() => {
                    setRedeemCode(viewingVoucher.code);
                    setViewingVoucher(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:bg-blue-800"
                >
                  Pilih Voucher Ini
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
