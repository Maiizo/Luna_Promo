// File: app/api/promo/sample/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, code, date_input, gender } = body;

    if (!phone || !name || !code) {
      return NextResponse.json({ success: false, error: "Data phone, name, atau code tidak boleh kosong" }, { status: 400 });
    }

    // Format Tanggal
    let formattedDate = new Date().toISOString().split('T')[0]; 
    if (date_input && date_input.includes('/')) {
      const [day, month, year] = date_input.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Simpan ke tabel customers
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([
        { 
           name: name, 
           phone: phone, 
           customer_type: 'eceran', 
           dob: formattedDate,
           gender: gender || 'Tidak Disebutkan' 
         }
      ])
      .select('id')
      .single(); 

    if (customerError) {
      return NextResponse.json({ success: false, error: customerError.message }, { status: 400 });
    }

    // Simpan ke tabel vouchers
    const { error: voucherError } = await supabase
      .from('vouchers')
      .insert([
        {
          code: code,
          customer_id: customerData.id, 
          discount_type: 'free_sample', 
          status: 'active'
        }
      ]);

    if (voucherError) {
      return NextResponse.json({ success: false, error: voucherError.message }, { status: 400 });
    }

    // Kirim WA via Fonnte (Teks Murni, Tanpa URL)
    const message = `Halo ${name}! 🐾\n\nTerima kasih telah berpartisipasi. Ini adalah bukti klaim FREE 1 pcs produk Akoong Sample dari Luna Pet Mall!\n\nKode Unik: SAMPLE-${code}\n\nSilakan tunjukkan pesan ini ke kasir kami. Sampai jumpa!`;

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone; 
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1); 
    }

    const formData = new FormData();
    formData.append('target', cleanPhone);
    formData.append('message', message);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': process.env.FONNTE_TOKEN || '',
      },
      body: formData, 
    });

    const fonnteData = await response.json();
    if (fonnteData.status) {
      return NextResponse.json({ success: true, message: "Data tersimpan & Voucher WA terkirim!" });
    } else {
      return NextResponse.json({ success: false, error: fonnteData.reason || "Fonnte menolak pengiriman" }, { status: 400 });
    }
  } catch (error) {
    console.error("Unexpected Error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan tak terduga" }, { status: 500 });
  }
}