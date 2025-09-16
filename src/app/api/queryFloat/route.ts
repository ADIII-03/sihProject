// app/api/queryFloat/route.ts
export const dynamic = "force-dynamic"; // ensures this API runs on server

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API] Incoming request body:", body);

    const { floatId, cycleNumber, parameters, depthRange, startDate, endDate } = body;

    const selectFields = [
      "p.id AS profile_id",
      "regexp_replace(p.platform_number, E'^b''(.*)''$', '\\1') AS platform_number",
      "p.cycle_number",
      "p.juld",
      "p.latitude",
      "p.longitude",
      "m.pres AS pressure",
    ];
    if (parameters.includes("temperature")) selectFields.push("m.temp AS temperature");
    if (parameters.includes("salinity")) selectFields.push("m.psal AS salinity");

    // build WHERE clause safely
    const whereConditions = [
      "regexp_replace(p.platform_number, E'^b''(.*)''$', '\\1') = $1",
      "m.pres BETWEEN $2 AND $3",
    ];
    const queryParams: any[] = [floatId, depthRange[0], depthRange[1]];
    let paramIndex = 4;

    if (cycleNumber && String(cycleNumber).trim() !== "") {
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

    console.log("[API] Final SQL Query:", sqlQuery, "Params:", queryParams);

    const rows = await query(sqlQuery, queryParams);
    console.log("SQL returned rows:", rows);
    return NextResponse.json({ data: rows });
  } catch (error: any) {
    console.error("[API] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
