// app/api/compareLocation/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[COMPARE LOCATION] Incoming body:", body);

    const { firstLat, firstLng, secondLat, secondLng, parameters, depthRange, startDate, endDate } = body;

    // --- Build safe SQL for each location ---
    const buildQuery = (lat: number, lng: number) => {
      const selectFields = ["m.pres AS depth"];
      if (parameters.includes("temperature")) selectFields.push("m.temp AS temperature");
      if (parameters.includes("salinity")) selectFields.push("m.psal AS salinity");
      if (parameters.includes("pressure")) selectFields.push("m.pres AS pressure");

      const whereConditions: string[] = [
        "p.latitude = $1",
        "p.longitude = $2",
        "m.pres BETWEEN $3 AND $4",
      ];
      const queryParams: any[] = [lat, lng, depthRange[0], depthRange[1]];

      let paramIndex = 5;

      if (startDate && endDate) {
        whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(startDate, endDate);
        paramIndex += 2;
      }

      return {
        sql: `
          SELECT ${selectFields.join(", ")}
          FROM profiles p
          JOIN measurements m ON p.id = m.profile_id
          WHERE ${whereConditions.join(" AND ")}
          ORDER BY m.pres;
        `.trim(),
        params: queryParams,
      };
    };

    const firstQuery = buildQuery(firstLat, firstLng);
    const secondQuery = buildQuery(secondLat, secondLng);

    console.log("[COMPARE LOCATION] First query:", firstQuery);
    console.log("[COMPARE LOCATION] Second query:", secondQuery);

    // --- Run both queries ---
    const [firstData, secondData] = await Promise.all([
      query(firstQuery.sql, firstQuery.params),
      query(secondQuery.sql, secondQuery.params),
    ]);

    return NextResponse.json({
      firstLocation: { lat: firstLat, lon: firstLng, data: firstData },
      secondLocation: { lat: secondLat, lon: secondLng, data: secondData },
    });
  } catch (error: any) {
    console.error("[COMPARE LOCATION] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
