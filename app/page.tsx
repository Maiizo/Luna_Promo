'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface DiscountTier {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
}

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [tiers, setTiers] = useState<DiscountTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [newTierName, setNewTierName] = useState<string>('');
  const [newTierType, setNewTierType] = useState<DiscountTier['discount_type']>('percentage');
  const [newTierValue, setNewTierValue] = useState<string>('');
  const [isSavingTier, setIsSavingTier] = useState<boolean>(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else {
        setSession(session);
        fetchTiers();
      }
    });
  }, [router]);

  const fetchTiers = async () => {
    const { data, error } = await supabase.from('discount_tiers').select('*');
    if (!error && data) setTiers(data as DiscountTier[]);
  };

  const handleAddTier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsedValue = Number(newTierValue);

    if (!newTierName.trim() || !newTierValue || Number.isNaN(parsedValue) || parsedValue <= 0) {
      alert('Masukkan nama diskon dan nilai diskon yang valid.');
      return;
    }

    setIsSavingTier(true);

    const { error } = await supabase.from('discount_tiers').insert([
      {
        name: newTierName.trim(),
        discount_type: newTierType,
        discount_value: parsedValue,
      },
    ]);

    if (error) {
      alert('Gagal menyimpan jenis diskon: ' + error.message);
      setIsSavingTier(false);
      return;
    }

    await fetchTiers();
    setNewTierName('');
    setNewTierType('percentage');
    setNewTierValue('');
    setIsSavingTier(false);
  };

  const selectedTierDetails = tiers.find((tier) => tier.id === selectedTier);

  const formatDiscountLabel = (tier: DiscountTier) => {
    if (tier.discount_type === 'percentage') return `${tier.discount_value}% diskon`;
    return `Rp${tier.discount_value} diskon`;
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTier) {
      alert('Pilih jenis diskon terlebih dahulu.');
      return;
    }

    setIsGenerating(true);

    const newCode = 'PET-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const tierDetails = tiers.find((tier) => tier.id === selectedTier);

    const { error: dbError } = await supabase.from('vouchers').insert([
      {
        code: newCode,
        tier_id: selectedTier,
        platform: 'offline',
        status: 'dispensed',
        customer_email: customerEmail || null,
      },
    ]);

    if (dbError) {
      alert('Gagal membuat kode: ' + dbError.message);
      setIsGenerating(false);
      return;
    }

    if (customerEmail && tierDetails) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            code: newCode,
            tierName: tierDetails.name,
          }),
        });
      } catch (err) {
        console.error('Gagal mengirim email', err);
      }
    }

    setGeneratedCode(newCode);
    setCustomerEmail('');
    setIsGenerating(false);
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Dasbor Promo</h1>
          </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <form onSubmit={handleAddTier} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">Tambah Jenis Diskon</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nama diskon"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:col-span-2"
                  value={newTierName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTierName(e.target.value)}
                />

                <select
                  value={newTierType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTierType(e.target.value as DiscountTier['discount_type'])}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                >
                  <option value="percentage">Persentase</option>
                  <option value="fixed_amount">Nominal tetap</option>
                </select>

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Nilai"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  value={newTierValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTierValue(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSavingTier}
                className={`mt-4 w-full rounded-2xl px-4 py-4 text-base font-bold text-white transition ${
                  isSavingTier
                    ? 'cursor-not-allowed bg-slate-400'
                    : 'bg-slate-900 hover:bg-slate-800 active:bg-black'
                }`}
              >
                {isSavingTier ? 'Menyimpan...' : 'Tambah Jenis Diskon'}
              </button>
            </form>

            <form onSubmit={handleGenerate} className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Buat Voucher</h2>
            </div>

            <div className="mb-6">
          

              <div className="grid gap-3 sm:grid-cols-2">
                {tiers.map((tier) => {
                  const isSelected = tier.id === selectedTier;

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier.id)}
                      aria-pressed={isSelected}
                      className={`rounded-2xl border-2 px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-green-600 bg-green-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-900">{tier.name}</div>
                          <div className="mt-1 text-sm text-slate-600">{formatDiscountLabel(tier)}</div>
                        </div>
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 ${
                            isSelected ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {!tiers.length && <p className="mt-3 text-sm text-amber-700">Belum ada jenis diskon yang dimuat.</p>}
            </div>

            <input
              type="email"
              placeholder="Email pelanggan"
              className="mb-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-100"
              value={customerEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerEmail(e.target.value)}
            />

            <button
              type="submit"
              disabled={isGenerating || !selectedTier}
              className={`w-full rounded-2xl px-4 py-4 text-base font-bold text-white transition ${
                isGenerating || !selectedTier
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
              }`}
            >
              {isGenerating ? 'Membuat...' : 'Buat QR & Kode'}
            </button>
            </form>
          </div>

          {generatedCode && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                <QRCodeCanvas value={generatedCode} size={200} level="H" includeMargin={true} />
              </div>

              <p className="text-3xl font-mono font-bold tracking-wider text-slate-900">{generatedCode}</p>
              {selectedTierDetails && (
                <p className="mt-2 text-sm text-slate-600">
                  {selectedTierDetails.name} · {formatDiscountLabel(selectedTierDetails)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
