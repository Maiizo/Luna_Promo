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
  
  // STATE BARU UNTUK CUSTOM ERROR NOTIFICATION
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // FUNGSI UNTUK MENAMPILKAN ERROR
  const showError = (message: string) => {
    setErrorToast(message);
    // Hilangkan error otomatis setelah 4 detik
    setTimeout(() => {
      setErrorToast(null);
    }, 4000);
  };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const rawPhone = formData.phone.trim();

    // 1. VALIDASI KETAT
    if (!/^62\d+$/.test(rawPhone)) {
      showError("Nomor WA harus diawali '62' dan hanya berisi angka");
      setLoading(false); 
      return;
    }
    if (rawPhone.length < 7 || rawPhone.length > 17) {
      showError("Nomor WA harus terdiri dari 7 hingga 17 digit angka");
      setLoading(false); 
      return;
    }

    // 2. ANTI-SPAM CEK KE DATABASE (Tetap di Frontend agar cepat)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', rawPhone)
      .maybeSingle();

    if (existingCustomer) {
      showError("Maaf, Nomor WhatsApp ini sudah pernah mengklaim voucher");
      setLoading(false);
      return;
    }

    // 3. FORMAT TANGGAL UNTUK DIKIRIM KE BACKEND
    let formattedDob = formData.dob;
    if (formData.dob) {
      const [year, month, day] = formData.dob.split('-');
      formattedDob = `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
    }
    const genderToSave = formData.gender === 'L' ? 'M' : 'F';
    
    // 4. GENERATE RANDOM CODE
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 5. INI YANG HILANG! FETCH KE BACKEND (API ROUTE)
    try {
      const response = await fetch('/api/promo/50k', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: rawPhone,
          email: formData.email,
          gender: genderToSave,
          date_input: formattedDob,
          code: randomCode
        }),
      });

      const result = await response.json();

      if (result.success) {
        setVoucherCode('50K-' + randomCode); // Tampilkan QR di layar
      } else {
        showError(result.error || "Gagal memproses voucher");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showError("Terjadi kesalahan koneksi ke server");
    }

    setLoading(false);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Amaranth:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-amaranth { font-family: 'Amaranth', sans-serif; }
        
        /* Animasi masuk untuk Toast yang diperbaiki */
        @keyframes slideDown {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out forwards; }
      `}} />



      {/* ==========================================
          CUSTOM TOAST ERROR NOTIFICATION
          ========================================== */}
      {/* ==========================================
          CUSTOM TOAST ERROR NOTIFICATION
          ========================================== */}
      {errorToast && (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full pointer-events-none px-4">
          <div className="w-full max-w-sm bg-[#DB3347] text-white px-5 py-3 rounded-2xl border-4 border-[#000000] shadow-[4px_4px_0px_#000000] flex items-start gap-3 animate-slideDown pointer-events-auto">
            <span className="text-xl">⚠️</span>
            <p className="font-sans font-bold text-sm leading-tight pt-0.5">{errorToast}</p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-[#FFF2E0] font-amaranth text-[#000000] pb-12 selection:bg-[#F06685] selection:text-white">
        
        {voucherCode ? (
          <div className="flex flex-col items-center p-6 pt-12">
            <div className="bg-white p-4 sm:p-8 rounded-[32px] border-4 border-[#000000] shadow-[8px_8px_0px_#F06685] max-w-sm w-full text-center">
              <h2 className="text-3xl font-bold mb-2">Terima Kasih!</h2>
              
              <div className="bg-[#FACCCC] p-5 rounded-2xl border-2 border-[#000000] mb-8">
                <p className="text-lg font-bold mb-3">Langkah Terakhir:</p>
                <a 
                  href="https://maps.app.goo.gl/p1ufiChGmCn4TYBf7" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 w-full bg-[#F06685] text-white hover:bg-[#DB3347] transition-colors p-3 rounded-xl font-bold border-2 border-[#000000] shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none mb-4"
                >
                  Berikan Review Google
                </a>
                <p className="text-xs font-sans font-medium leading-relaxed">
                  Klik tombol di atas, lalu tunjukkan bukti ke kasir.
                </p>
              </div>

              <div id="qr-code-container" className="bg-[#FFF2E0] p-4 inline-block rounded-3xl border-4 border-[#F0D9CC] mb-2 w-full max-w-[232px] h-auto">
                <QRCodeCanvas value={voucherCode} size={200} fgColor="#000000" bgColor="#FFF2E0" className="w-full h-auto" />
              </div>

              {/* <button
                onClick={() => {
                  const canvas = document.querySelector('#qr-code-container canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Voucher-Luna-${voucherCode}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="block mx-auto mb-6 font-sans text-xs font-bold text-black bg-[#F0D9CC] px-3 py-1 rounded-lg border-2 border-black hover:bg-[#e6c8b5] transition-colors"
              >
                Unduh QR Code
              </button> */}
              


<a
  href={`https://wa.me/6282330059341?text=Halo%20Luna%20Pet%20Mall!%20Ini%20kode%20voucher%20saya:%2050K-${voucherCode}%0A%0AQR%20Code:%20https://quickchart.io/qr?text=50K-${voucherCode}&size=300`}
  // ... (sisa atribut lainnya)   target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors p-4 rounded-xl font-bold border-4 border-[#000000] shadow-[4px_4px_0px_#000000] active:translate-y-1 active:shadow-none mb-6 text-lg"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Kirim Kode ke WA Kasir
              </a>



              <div className="bg-[#F0D9CC] p-3 rounded-xl mb-4 border-2 border-[#000000] border-dashed">
                <p className="text-2xl font-mono font-bold tracking-widest">{voucherCode}</p>
              </div>
              
              <p className="text-white font-bold text-base bg-[#DB3347] py-2 px-4 rounded-full border-2 border-black shadow-[2px_2px_0px_#000000]">
                Berlaku hingga 19 Agustus 2026
              </p>
            </div>
          </div>
        ) : (
          
          <>
            <div className="pt-12 pb-20 px-6 text-center relative z-0">
              <div className="w-28 h-28 bg-white rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-[#000000] shadow-[6px_6px_0px_#F06685] overflow-hidden">
                <img src="/Luna.jpg" alt="Luna Pet Mall Logo" className="w-full h-full object-cover" />
              </div>
              
              <p className="text-[#F06685] text-xl italic font-bold mb-6">Grow With Luna Pet-Mall</p>
              
              <div className="flex flex-col items-center gap-1 font-sans font-semibold text-sm">
                <p>📍 Jl. Jemur Andayani 1B, Surabaya</p>
                <p>📞 0817-398-810  </p>
                 <a href="https://linktr.ee/lunapetshopsby" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#F06685] font-bold hover:underline">
                  https://linktr.ee/lunapetshopsby
                </a>
              </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-10 relative z-10">
              
              <div className="bg-[#FACCCC] rounded-[24px] border-4 border-[#000000] shadow-[6px_6px_0px_#F06685] p-6 mb-8 text-center">
                <div className="bg-[#000000] text-white text-xs font-bold px-4 py-2 rounded-full inline-block mb-3 uppercase tracking-wider">
                  Promo Khusus!
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Klaim Voucher Rp 50.000
                </h2>
                <p className="font-sans text-sm font-medium">
                  Isi data diri di bawah ini untuk mendapatkan akses Voucher Diskon, link Google Review dan free AKOONG Sample.
                </p>
              </div>

              <div className="bg-white rounded-[32px] border-4 border-[#000000] shadow-[8px_8px_0px_#F0D9CC] p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-sans font-medium">
                  
                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Nama Lengkap *</label>
                    <input required type="text" placeholder="Nama..." className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Nomor WhatsApp *</label>
                    <input required type="text" placeholder="628xxxxxxxx" className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <p className="text-[10px] text-gray-500 mt-1.5 ml-1">Wajib menggunakan awalan 62 (contoh: 62812...)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#000000] mb-2">Email</label>
                    <input type="email" placeholder="email@contoh.com" className="w-full bg-[#FFF2E0] border-2 border-[#000000] p-3 rounded-xl focus:ring-0 focus:border-[#F06685] outline-none transition-all placeholder:text-gray-400" onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#000000] mb-2">Jenis Kelamin *</label>
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