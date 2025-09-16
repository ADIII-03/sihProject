// app/api/queryLocation/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API] Incoming request body:", body);

    const {
      latitude,
      longitude,
      cycle_number,
      juld_start,
      juld_end,
      pressure_min,
      pressure_max,
    } = body || {};

    const selectFields = [
      "p.id AS profile_id",
      "regexp_replace(p.platform_number, E'^b''(.*)''$', '\\1') AS platform_number",
      "p.cycle_number",
      "p.juld",
      "p.latitude",
      "p.longitude",
      "m.pres AS pressure",
      "m.temp AS temperature",
      "m.psal AS salinity",
    ];

    const whereConditions: string[] = ["1=1"];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (cycle_number !== undefined && cycle_number !== null) {
      whereConditions.push(`p.cycle_number = $${paramIndex++}`);
      queryParams.push(cycle_number);
    }

    if (juld_start && juld_end) {
      whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(juld_start, juld_end);
      paramIndex += 2;
    }

    if (pressure_min !== undefined && pressure_max !== undefined) {
      whereConditions.push(`m.pres BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(pressure_min, pressure_max);
      paramIndex += 2;
    }

    // 🌍 Location filter with ±5° tolerance
    if (latitude !== undefined && longitude !== undefined) {
      const latMin = latitude - 5;
      const latMax = latitude + 5;
      const lonMin = longitude - 5;
      const lonMax = longitude + 5;

      whereConditions.push(`p.latitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(latMin, latMax);
      paramIndex += 2;

      whereConditions.push(`p.longitude BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(lonMin, lonMax);
      paramIndex += 2;
    }

    const sqlQuery = `
      SELECT ${selectFields.join(", ")}
      FROM profiles p
      JOIN measurements m ON p.id = m.profile_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY ( (p.latitude - $1)^2 + (p.longitude - $2)^2 ), m.pres
      LIMIT 500;
    `.trim();

    console.log("[API] Final SQL Query:", sqlQuery, "Params:", queryParams);

    const rows = await query(sqlQuery, queryParams);
    console.log("[API] SQL returned rows:", rows);

    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[API] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
