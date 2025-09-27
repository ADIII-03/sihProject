export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[API] Incoming location request:", body);

    const {
      firstLat,
      firstLng,
      secondLat,
      secondLng,
      parameters = [],
      pressureRange = [0, 2000],
      startDate,
      endDate,
    } = body;

    if (firstLat == null || firstLng == null) {
      return NextResponse.json(
        { error: "firstLat and firstLng are required" },
        { status: 400 }
      );
    }

    if (secondLat == null || secondLng == null) {
      return NextResponse.json(
        { error: "secondLat and secondLng are required" },
        { status: 400 }
      );
    }

    // SELECT fields
    const selectFields = [
      "p.id AS profile_id",
      "p.platform_number",
      "p.cycle_number",
      "p.juld",
      "p.latitude",
      "p.longitude",
      "m.pres AS depth",
    ];
    if (parameters.includes("temperature")) selectFields.push("m.temp AS temperature");
    if (parameters.includes("salinity")) selectFields.push("m.psal AS salinity");

    // Optional date filter
    const dateCondition = startDate && endDate ? `AND p.juld BETWEEN $3 AND $4` : "";

    // Query for first location
    const sqlFirst = `
     WITH nearest_profile AS (
  SELECT 
    id,
    platform_number,
    cycle_number,
    juld,
    latitude,
    longitude
  FROM profiles
  ORDER BY (
    6371000 * acos(
      cos(radians($1)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians($2)) +
      sin(radians($1)) * sin(radians(latitude))
    )
  )
  LIMIT 1
)
SELECT ${selectFields.join(", ")}
FROM nearest_profile p
JOIN measurements m ON p.id = m.profile_id
WHERE m.pres BETWEEN $3 AND $4
${dateCondition}
ORDER BY m.pres;`
.trim();

    // Query for second location
    const sqlSecond = sqlFirst; // same structure, just different parameters

    const paramsFirst: any[] = [
      firstLat,
      firstLng,
      ...(startDate && endDate ? [startDate, endDate] : []),
      pressureRange[0],
      pressureRange[1],
    ];

    const paramsSecond: any[] = [
      secondLat,
      secondLng,
      ...(startDate && endDate ? [startDate, endDate] : []),
      pressureRange[0],
      pressureRange[1],
    ];

    const [firstRows, secondRows] = await Promise.all([
      query(sqlFirst, paramsFirst),
      query(sqlSecond, paramsSecond),
    ]);
const firstPlatform = firstRows[0]?.platform_number;
const secondPlatform = secondRows[0]?.platform_number;
   return NextResponse.json({
  firstLocation: { data: firstRows, nearestFloat: firstPlatform },
  secondLocation: { data: secondRows, nearestFloat: secondPlatform },
});
  } catch (error: any) {
    console.error("[API] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
