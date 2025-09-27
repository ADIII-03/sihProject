export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API] Incoming location request:", body);

    const {
      latitude,
      longitude,
      parameters = [],
      pressureRange = [0, 2000],
      startDate,
      endDate,
    } = body;

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

    // ✅ Build SELECT fields (always include pressure + platform_number)
    const selectFields = [
      "p.id AS profile_id",
      "p.platform_number",
      "p.cycle_number",
      "p.juld",
      "p.latitude",
      "p.longitude",
      "m.pres AS depth" // rename pres → depth
    ];
    if (parameters.includes("temperature"))
      selectFields.push("m.temp AS temperature");
    if (parameters.includes("salinity"))
      selectFields.push("m.psal AS salinity");
    if (parameters.includes("pressure") && !selectFields.includes("m.pres AS depth")) {
      selectFields.push("m.pres AS depth");
    }

    // ✅ Build WHERE conditions
    const whereConditions = ["m.pres BETWEEN $3 AND $4"];
    const queryParams: any[] = [latitude, longitude, pressureRange[0], pressureRange[1]];
    let paramIndex = 5;

    if (startDate && endDate) {
      whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    // ✅ SQL using plain Haversine (no extensions needed)
    const sqlQuery = `
      WITH nearest_profile AS (
        SELECT
          id,
          platform_number,
          cycle_number,
          juld,
          latitude,
          longitude,
          (
            6371000 * acos(
              cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude))
            )
          ) AS distance
        FROM profiles
        ORDER BY distance
        LIMIT 1
      )
      SELECT ${selectFields.join(", ")}
      FROM nearest_profile p
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
