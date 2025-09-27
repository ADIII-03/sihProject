import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get the latest profile per platform
    const sql = `
      SELECT DISTINCT ON (platform_number)
        platform_number,
        latitude::float AS latitude,
        longitude::float AS longitude,
        juld
      FROM profiles
      ORDER BY platform_number, juld DESC
    `;

    const rows = await query(sql);

    return NextResponse.json({ floats: rows });
  } catch (err: any) {
    console.error("[API] Error fetching latest floats:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
