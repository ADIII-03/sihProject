export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const floatId = searchParams.get("floatId");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!floatId) {
      return NextResponse.json({ error: "Missing floatId" }, { status: 400 });
    }

    const where: string[] = ["platform_number::text = $1"];
    const params: any[] = [floatId];
    let idx = 2;

    if (startDate && endDate) {
      where.push(`juld BETWEEN $${idx} AND $${idx + 1}`);
      params.push(startDate, endDate);
      idx += 2;
    }

    const sql = `
      SELECT latitude, longitude
      FROM profiles
      WHERE ${where.join(" AND ")}
      ORDER BY juld ASC;
    `;

    const result = await query(sql, params);
    const rows = result.rows || result; // handle pg vs. pooled result

    const trajectory = rows.map((r: any) => ({
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    return NextResponse.json({ data: trajectory });
  } catch (err: any) {
    console.error("Trajectory API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
