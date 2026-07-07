// app/api/promo/50k/route.ts
import { NextResponse } from 'next/server';

// Kerangka dasar untuk menerima request POST (Persiapan untuk WA Bot nanti)
export async function POST(request: Request) {
  try {
    // Nanti logika WhatsApp dikerjakan di sini
    const body = await request.json();
    
    return NextResponse.json({ 
      success: true, 
      message: "API Route 50k siap digunakan!" 
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// Kerangka dasar untuk GET (Hanya agar tidak error saat build)
export async function GET() {
  return NextResponse.json({ message: "Endpoint 50k aktif" });
}