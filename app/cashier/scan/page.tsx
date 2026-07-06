// app/cashier/scan/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [voucherData, setVoucherData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  // Ensure only logged-in cashiers can access
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
    });
  }, [router]);

  const handleScan = async (text: string) => {
    if (scannedCode) return; // Prevent scanning multiple times rapidly
    setScannedCode(text);
    setErrorMsg(null);

    // Lookup voucher in DB
    const { data, error } = await supabase
      .from('vouchers')
      .select('*, customers(*)')
      .eq('code', text)
      .single();

    if (error || !data) {
      setErrorMsg("Voucher not found or invalid.");
    } else {
      setVoucherData(data);
    }
  };

  const handleRedeem = async () => {
    if (!voucherData) return;
    
    const { error } = await supabase
      .from('vouchers')
      .update({ 
        status: 'redeemed',
        redeemed_at: new Date().toISOString()
      })
      .eq('id', voucherData.id);

    if (!error) {
      alert("Voucher successfully redeemed!");
      // Reset scanner for the next customer
      setScannedCode(null);
      setVoucherData(null);
    } else {
      alert("Failed to redeem voucher.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Redeem Voucher</h1>

      {!scannedCode && (
        <div className="rounded-lg overflow-hidden border-4 border-gray-300">
          <Scanner 
            onResult={(text) => handleScan(text)} 
            onError={(error) => console.log(error?.message)} 
          />
          <p className="text-center mt-2 text-gray-500">Point camera at customer's QR Code</p>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-100 p-4 rounded text-red-700 mt-4 text-center">
          <p className="font-bold">{errorMsg}</p>
          <button onClick={() => setScannedCode(null)} className="mt-4 underline">Scan Again</button>
        </div>
      )}

      {voucherData && (
        <div className="bg-white border p-4 rounded mt-4 shadow">
          <h2 className="text-xl font-bold text-blue-600 mb-2">
            {voucherData.discount_type === '50k_discount' ? 'Diskon Rp 50.000' : 'Free Sample'}
          </h2>
          
          <div className="text-sm text-gray-700 mb-4 space-y-1">
            <p><strong>Status:</strong> 
              <span className={`ml-2 font-bold ${voucherData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {voucherData.status.toUpperCase()}
              </span>
            </p>
            <p><strong>Code:</strong> {voucherData.code}</p>
            <p><strong>Customer Name:</strong> {voucherData.customers?.name}</p>
            <p><strong>Phone:</strong> {voucherData.customers?.phone}</p>
            <p><strong>Customer Type:</strong> {voucherData.customers?.customer_type}</p>
          </div>

          {voucherData.status === 'active' ? (
             <button onClick={handleRedeem} className="w-full bg-green-600 text-white p-3 rounded font-bold">
               Validasi & Gunakan Voucher
             </button>
          ) : (
            <button onClick={() => {setScannedCode(null); setVoucherData(null);}} className="w-full bg-gray-600 text-white p-3 rounded font-bold">
              Voucher Cannot Be Used. Scan Another.
            </button>
          )}
        </div>
      )}
    </div>
  );
}