// app/api/send-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, code, tierName } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Petshop Promo <onboarding@resend.dev>', // Default testing address
      to: email, // Must be your verified Resend email during testing
      subject: 'Your Petshop Discount Voucher!',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Thanks for shopping with us!</h2>
          <p>Here is your <strong>${tierName}</strong> voucher code:</p>
          <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center; border-radius: 5px;">
            ${code}
          </div>
          <p>Show this code or the QR code at the cashier on your next visit.</p>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ data });

  } catch (error) {
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}