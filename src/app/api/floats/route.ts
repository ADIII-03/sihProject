import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sqlQuery = `
      SELECT DISTINCT ON (p.platform_number)
        regexp_replace(p.platform_number, E'^b''(.*)''$', '\\1') AS platform_number,
        p.latitude,
        p.longitude,
        p.juld
      FROM profiles p
      ORDER BY p.platform_number, p.juld DESC;
    `;

    const rows = await query(sqlQuery, []);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("[API] DB OFF:", error.message);

    // Return empty array if DB fails
    return NextResponse.json([]);
  }
}
