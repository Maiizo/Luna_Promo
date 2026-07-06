'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

export default function Promo50kPage() {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', gender: '', dob: '', address: ''
  });
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .insert([{
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address || null,
        customer_type: 'eceran'
      }])
      .select('id')
      .single();

    if (customerErr || !customer) {
      alert("Gagal menyimpan data. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    const code = '50K-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: voucherErr } = await supabase
      .from('vouchers')
      .insert([{
        code: code,
        customer_id: customer.id,
        discount_type: 'free_sample',
        status: 'active'
      }]);

    if (!voucherErr) setVoucherCode(code);
    setLoading(false);
  };

  // ==========================================
  // TAMPILAN JIKA VOUCHER BERHASIL DIGENERATE
  // ==========================================
  if (voucherCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pt-12">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border-t-8 border-blue-600">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Selamat! 🎉</h2>
          <p className="text-gray-600 mb-8 text-sm">Voucher Diskon Rp 50.000 kamu sudah siap.</p>
          
          <div className="bg-white p-4 inline-block rounded-2xl shadow-inner border-2 border-gray-100 mb-6">
            <QRCodeCanvas value={voucherCode} size={220} />
          </div>
          
          <div className="bg-gray-100 p-3 rounded-lg mb-6">
            <p className="text-3xl font-mono font-bold text-blue-700 tracking-widest">{voucherCode}</p>
          </div>
          
          <p className="text-red-500 font-bold text-sm bg-red-50 py-2 rounded-full mb-6">
            Berlaku hingga 19 Agustus 2026
          </p>
          
          <div className="bg-blue-50 p-4 rounded-xl text-left">
            <p className="text-sm text-blue-800 font-semibold mb-1">Langkah Terakhir:</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Tunjukkan layar HP ini dan bukti review Google Maps kamu ke kasir kami untuk menggunakan voucher.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN HALAMAN UTAMA & FORM (LANDING PAGE)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      
      {/* 1. HERO SECTION (COMPANY PROFILE) */}
      <div className="bg-blue-600 text-white pt-12 pb-24 px-6 rounded-b-[3rem] shadow-lg text-center relative">
        {/* Placeholder Logo - Ganti src dengan link logo Luna Pet Mall */}
        <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-md overflow-hidden">
          <span className="text-blue-600 font-bold text-xl">LUNA</span>
          {/* <img src="/logo-luna.png" alt="Luna Pet Mall Logo" className="w-full h-full object-cover" /> */}
        </div>
        
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Luna Pet Mall</h1>
        <p className="text-blue-200 font-medium italic mb-6">"Grow With Luna Pet-Mall"</p>
        
        <div className="flex flex-col items-center gap-2 text-sm text-blue-100">
          <p className="flex items-center gap-2">
            📍 Jl. Jemur Andayani 18, Surabaya
          </p>
          <p className="flex items-center gap-2">
            📱 0812-1620-2221 | 📷 @lunapetshopsby
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-16 relative z-10">
        
        {/* 2. KARTU PROMO & GOOGLE REVIEW */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 text-center border border-gray-100">
          <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
            PROMO KHUSUS!
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Dapatkan Free Voucher Rp 50.000
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Cukup berikan ulasan positif di Google Maps dan isi data diri kamu di bawah ini.
          </p>
          
          <a 
            href="https://maps.google.com/..." 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center justify-center gap-2 w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors p-3 rounded-xl font-bold"
          >
            ⭐ 1. Klik untuk Review Google
          </a>
        </div>

        {/* 3. FORMULIR DATA DIRI */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Isi Data Pengiriman Voucher
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap *</label>
              <input required type="text" placeholder="Masukkan nama kamu" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor WhatsApp *</label>
              <input required type="tel" placeholder="0812xxxxxxx" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input type="email" placeholder="email@contoh.com" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                <select required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white" onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="">Pilih...</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Lahir *</label>
                <input required type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alamat Domisili <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <textarea placeholder="Tuliskan alamat lengkap..." rows={3} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            
            <button 
              disabled={loading} 
              type="submit" 
              className={`w-full text-white p-4 rounded-xl font-bold mt-2 shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-blue-500/30'}`}
            >
              {loading ? 'Memproses Data...' : 'Klaim Voucher Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}