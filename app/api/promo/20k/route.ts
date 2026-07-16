import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, code, date_input, gender } = body;

    // Validasi data dasar
    if (!phone || !name || !code) {
      return NextResponse.json({ success: false, error: "Data phone, name, atau code tidak boleh kosong" }, { status: 400 });
    }

    // --- 1. PERBAIKI FORMAT TANGGAL UNTUK KOLOM 'dob' ---
    let formattedDate = new Date().toISOString().split('T')[0]; 
    if (date_input && date_input.includes('/')) {
      const [day, month, year] = date_input.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // --- 2. STEP 1: SIMPAN KE TABEL 'customers' ---
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([
        { 
          name: name, 
          phone: phone, 
                customer_type: 'eceran', 
          dob: formattedDate, // Format YYYY-MM-DD yang benar
          gender: gender || 'Tidak Disebutkan' // Wajib di DB kamu (ikon diamond solid)
        }
      ])
      .select('id') // Kita butuh ID UUID-nya untuk disambung ke tabel vouchers
      .single(); 

    if (customerError) {
      console.error("Supabase Customer Error:", customerError);
      return NextResponse.json({ success: false, error: customerError.message }, { status: 400 });
    }

// --- 3. STEP 2: SIMPAN KE TABEL 'vouchers' ---
    const { error: voucherError } = await supabase
      .from('vouchers')
      .insert([
        {
          code: code,
          customer_id: customerData.id, 
          discount_type: '25k_discount', // <-- UBAH JADI INI (huruf kecil & pakai _discount)
          status: 'active'               // <-- UBAH JADI INI (huruf kecil)
        }
      ]);

    if (voucherError) {
      console.error("Supabase Voucher Error:", voucherError);
      return NextResponse.json({ success: false, error: voucherError.message }, { status: 400 });
    }

    // --- 4. KIRIM WA VIA FONNTE ---
    const qrImageUrl = `https://quickchart.io/qr?text=25K-${code}&size=300&margin=2`;
    const message = `Halo ${name}! 🐾\n\nTerima kasih telah berpartisipasi. Ini adalah Voucher Diskon Rp 25.000 + FREE 1 pcs produk Akoong dari Luna Pet Mall!\n\nKode Unik: 25K-${code}\n\nSilakan tunjukkan QR Code ini ke kasir kami. Sampai jumpa!`;

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        url: qrImageUrl 
      }),
    });

    const fonnteData = await response.json();

    if (fonnteData.status) {
      return NextResponse.json({ success: true, message: "Data tersimpan & Voucher WA terkirim!" });
    } else {
      console.error("Fonnte API Error:", fonnteData);
      return NextResponse.json({ success: false, error: fonnteData.reason }, { status: 400 });
    }

  } catch (error) {
    console.error("Server Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 250 });
  }
}