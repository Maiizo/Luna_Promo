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

    const genderToSave = formData.gender === 'L' ? 'M' : 'F';

    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .insert([{
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        gender: genderToSave,
        dob: formData.dob,
        address: formData.address || null,
        customer_type: 'eceran',
        is_frozen: 0,
        accept_newsletter: 1,
        credit_limit: 0
      }])
      .select('id')
      .single();

    if (customerErr || !customer) {
      alert("Error dari Supabase: " + customerErr.message);
      setLoading(false);
      return;
    }

    const code = '50K-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: voucherErr } = await supabase
      .from('vouchers')
      .insert([{
        code: code,
        customer_id: customer.id,
        discount_type: '50k_discount',
        status: 'active'
      }]);

    if (!voucherErr) setVoucherCode(code);
    setLoading(false);
  };

  return (
    <>
      {/* Import Font Amaranth sesuai Brand Guidelines Luna */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Amaranth:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-amaranth { font-family: 'Amaranth', sans-serif; }
      `}} />

      {/* Latar Belakang menggunakan Luna Eggshell (#FFF2E0) */}
      <div className="min-h-screen bg-[#FFF2E0] font-amaranth text-[#000000] pb-12 selection:bg-[#F06685] selection:text-white">
        
        {/* ==========================================
            TAMPILAN JIKA FORM BERHASIL DISUBMIT
            ========================================== */}
        {voucherCode ? (
          <div className="flex flex-col items-center p-6 pt-12">
            <div className="bg-white p-8 rounded-[32px] border-4 border-[#000000] shadow-[8px_8px_0px_#F06685] max-w-sm w-full text-center">
              <h2 className="text-3xl font-bold mb-2">Terima Kasih!</h2>
              
              <div className="bg-[#FACCCC] p-5 rounded-2xl border-2 border-[#000000] mb-8">
                <p className="text-lg font-bold mb-3">Langkah Terakhir:</p>
                <a 
                  href="https://maps.google.com/YOUR_LINK_HERE" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 w-full bg-[#F06685] text-white hover:bg-[#DB3347] transition-colors p-3 rounded-xl font-bold border-2 border-[#000000] shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none mb-4"
                >
                  Berikan Review Google
                </a>
                <p className="text-xs font-sans font-medium leading-relaxed">
                  Klik tombol di atas, lalu tunjukkan bukti review.
                </p>
              </div>

              <div className="bg-[#FFF2E0] p-4 inline-block rounded-3xl border-4 border-[#F0D9CC] mb-4">
                <QRCodeCanvas value={voucherCode} size={200} fgColor="#000000" bgColor="#FFF2E0" />
              </div>
              
              <div className="bg-[#F0D9CC] p-3 rounded-xl mb-4 border-2 border-[#000000] border-dashed">
                <p className="text-2xl font-mono font-bold tracking-widest">{voucherCode}</p>
              </div>
              
              <p className="text-[#F06685] font-bold text-sm bg-white border-2 border-[#F06685] py-2 rounded-full shadow-[2px_2px_0px_#F06685]">
                Berlaku hingga 19 Agustus 2026
              </p>
            </div>
          </div>
        ) : (
          
        /* ==========================================
           TAMPILAN HALAMAN UTAMA & FORM (LANDING PAGE)
           ========================================== */
          <>
            {/* HERO SECTION */}
            <div className="pt-12 pb-20 px-6 text-center relative z-0">
              <div className="w-28 h-28 bg-white rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-[#000000] shadow-[6px_6px_0px_#F06685] overflow-hidden">
                {/* Gunakan logo Luna di sini. Sementara pakai teks Amaranth Bold */}
                <span className="text-[#F06685] font-bold text-3xl italic">Luna</span>
              </div>
              
              <h1 className="text-4xl font-bold mb-1 tracking-tight">Luna Pet Mall</h1>
              <p className="text-[#F06685] text-xl italic font-bold mb-6">Grow With Luna Pet-Mall</p>
              
              <div className="flex flex-col items-center gap-1 font-sans font-semibold text-sm">
                <p>📍 Jl. Jemur Andayani 1B, Surabaya</p>
                <p>📱 0812-1620-2221 | 📷 @lunapetshopsby</p>
              </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
              
              {/* KARTU INFO PROMO */}
              <div className="bg-[#FACCCC] rounded-[24px] border-4 border-[#000000] shadow-[6px_6px_0px_#F06685] p-6 mb-8 text-center">
                <div className="bg-[#000000] text-white text-xs font-bold px-4 py-2 rounded-full inline-block mb-3 uppercase tracking-wider">
                  Promo Khusus!
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Klaim Voucher Rp 50.000
                </h2>
                <p className="font-sans text-sm font-medium">
                  Isi data diri kamu di bawah ini untuk mendapatkan akses Voucher Diskon dan link Google Review.
                </p>
              </div>

              {/* FORMULIR DATA DIRI */}
              <div className="bg-white rounded-[32px] border-4 border-[#000000] shadow-[8px_8px_0px_#F0D9CC] p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-sans font-medium">
                  
                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Nama Lengkap *</label>
                    <input required type="text" placeholder="Nama " className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Nomor WhatsApp *</label>
                    <input required type="tel" placeholder="0812xxxxxxx" className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Email</label>
                    <input type="email" placeholder="email@contoh.com" className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#000000] mb-2">Gender *</label>
                      <select required className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all" onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Pilih...</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-[#000000] mb-2">Tanggal Lahir *</label>
                      <input required type="date" className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all" onChange={e => setFormData({...formData, dob: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Alamat Domisili </label>
                    <textarea placeholder="Tuliskan alamat lengkap..." rows={3} className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all resize-none placeholder:text-gray-400" onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  
                  <button 
                    disabled={loading} 
                    type="submit" 
                    className={`w-full font-amaranth text-xl p-4 rounded-2xl font-bold mt-4 transition-all border-4 border-[#000000] ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-[0px_0px_0px_#000000]' : 'bg-[#F06685] text-white hover:bg-[#DB3347] shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none'}`}
                  >
                    {loading ? 'Memproses...' : 'Dapatkan Voucher!'}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}