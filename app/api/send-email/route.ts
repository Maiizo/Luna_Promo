// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Menggunakan Gmail gratis
  auth: {
    user: process.env.SMTP_USER, // Email gmail Anda
    pass: process.env.SMTP_PASS, // App Password gmail Anda
  },
});

export async function POST(request: Request) {
  try {
    const { email, code, tierName } = await request.json();

    // Generate QR Code image as data URL
    const qrDataUrl = await QRCode.toDataURL(code, {
      type: 'image/png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    
    // Extract base64 part
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    const mailOptions = {
      from: `"Luna Promo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Voucher Diskon Luna Promo Anda!',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #2563eb; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Luna Promo</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Terima kasih atas kunjungan Anda!</p>
          </div>
          <div style="padding: 32px; background-color: #ffffff; text-align: center;">
            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">Berikut adalah kode voucher <strong>${tierName}</strong> Anda:</p>
            
            <div style="margin-bottom: 24px;">
              <img src="cid:qrcode-image" alt="QR Code Voucher" style="width: 200px; height: 200px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: white;" />
            </div>

            <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="font-size: 15px; color: #64748b; line-height: 1.6;">
              Tunjukkan QR Code ini atau kode voucher di atas pada kasir saat kunjungan berikutnya untuk mengklaim diskon Anda. Anda juga dapat mengunduh file QR Code pada lampiran email ini.
            </p>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 13px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Luna Promo. Semua hak cipta dilindungi.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `voucher-${code}.png`,
          content: base64Data,
          encoding: 'base64',
          contentType: 'image/png',
          contentDisposition: 'inline',
          cid: 'qrcode-image' // must match the src in img tag
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ data: info });

  } catch (error: any) {
    console.error("Nodemailer Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}