import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Meta akan mengirimkan 3 parameter ini untuk mengetes koneksi
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Ini adalah kata sandi rahasia buatanmu sendiri (bebas diubah)
  const VERIFY_TOKEN = "LUNA_PET_SECRET_321";

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Jika token cocok, kembalikan nilai 'challenge' agar Meta tahu pintunya terbuka
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}


