import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, code } = body;

    // Validasi sederhana
    if (!phone || !name || !code) {
      return NextResponse.json({ success: false, error: "Data phone, name, atau code tidak boleh kosong" }, { status: 400 });
    }

    // Generate URL QR Code
    const qrImageUrl = `https://quickchart.io/qr?text=25K-${code}&size=300&margin=2`;

    // Format Pesan WhatsApp
    const message = `Halo ${name}! 🐾\n\nTerima kasih telah berpartisipasi. Ini adalah Voucher Diskon Rp 25.000 + FREE 1 pcs produk Akoong dari Luna Pet Mall!\n\nKode Unik: 25K-${code}\n\nSilakan tunjukkan QR Code ini ke kasir kami. Sampai jumpa!`;

    // Hit API Fonnte
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

    const data = await response.json();

    if (data.status) {
      return NextResponse.json({ success: true, message: "Voucher 25K berhasil dikirim via WA!" });
    } else {
      console.error("Fonnte API Error:", data);
      return NextResponse.json({ success: false, error: data.reason || "Gagal dari Fonnte" }, { status: 400 });
    }

  } catch (error) {
    console.error("Server Route Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}