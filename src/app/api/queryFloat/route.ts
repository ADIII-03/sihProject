export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API] Incoming request body:", body);

    const { floatId, cycleNumber, parameters = [], depthRange = [0, 2000], startDate, endDate } = body;
    const floatIdTrimmed = String(floatId).trim();

    // SELECT fields: always depth (pres) included
    const selectFields = [
      "p.id AS profile_id",
      "p.platform_number",
      "p.cycle_number",
      "p.juld",
      "p.latitude",
      "p.longitude",
      "m.pres AS depth"
    ];
    if (parameters.includes("temperature")) selectFields.push("m.temp AS temperature");
    if (parameters.includes("salinity")) selectFields.push("m.psal AS salinity");
    if (parameters.includes("pressure")) selectFields.push("m.pres AS pressure"); // pressure as separate param

    const whereConditions = ["p.platform_number = $1", "m.pres BETWEEN $2 AND $3"];
    const queryParams: any[] = [floatIdTrimmed, depthRange[0], depthRange[1]];
    let paramIndex = 4;

    if (cycleNumber?.trim()) {
      whereConditions.push(`p.cycle_number = $${paramIndex}`);
      queryParams.push(Number(cycleNumber));
      paramIndex++;
    }

    if (startDate && endDate) {
      whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    const sqlQuery = `
      SELECT ${selectFields.join(", ")}
      FROM profiles p
      JOIN measurements m ON p.id = m.profile_id
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY m.pres;
    `.trim();

    console.log("[API] SQL:", sqlQuery, "Params:", queryParams);

    const rows = await query(sqlQuery, queryParams);
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[API] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
