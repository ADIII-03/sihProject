// app/api/compareFloat/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[COMPARE FLOAT] Incoming body:", body);

    const {
      firstFloat,
      secondFloat,
      firstCycle,
      secondCycle,
      parameters = [],
      depthRange = [0, 2000],
      startDate,
      endDate,
    } = body;

    if (!firstFloat || !secondFloat) {
      return NextResponse.json(
        { error: "Both firstFloat and secondFloat are required." },
        { status: 400 }
      );
    }

    const buildQuery = (
      floatId: string,
      cycleNumber?: number
    ): { sql: string; params: any[] } => {
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
      if (parameters.includes("pressure")) selectFields.push("m.pres AS pressure");

      const whereConditions = ["p.platform_number = $1", "m.pres BETWEEN $2 AND $3"];
      const queryParams: any[] = [floatId.trim(), depthRange[0], depthRange[1]];
      let paramIndex = 4;

      if (cycleNumber !== undefined) {
        whereConditions.push(`p.cycle_number = $${paramIndex}`);
        queryParams.push(Number(cycleNumber));
        paramIndex++;
      }

      if (startDate && endDate) {
        whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(startDate, endDate);
        paramIndex += 2;
      }

      const sql = `
        SELECT ${selectFields.join(", ")}
        FROM profiles p
        JOIN measurements m ON p.id = m.profile_id
        WHERE ${whereConditions.join(" AND ")}
        ORDER BY m.pres;
      `.trim();

      return { sql, params: queryParams };
    };

    const firstQuery = buildQuery(firstFloat, firstCycle);
    const secondQuery = buildQuery(secondFloat, secondCycle);

    console.log("[COMPARE FLOAT] First query:", firstQuery);
    console.log("[COMPARE FLOAT] Second query:", secondQuery);

    const [firstData, secondData] = await Promise.all([
      query(firstQuery.sql, firstQuery.params),
      query(secondQuery.sql, secondQuery.params),
    ]);

    return NextResponse.json({
      firstFloat: { floatId: firstFloat, data: firstData },
      secondFloat: { floatId: secondFloat, data: secondData },
    });
  } catch (error: any) {
    console.error("[COMPARE FLOAT] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
