// app/api/compareFloat/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[COMPARE FLOAT] Incoming body:", body);

    const { firstFloat, secondFloat, floatId, parameters, depthRange, startDate, endDate } = body;

    // fallback support if frontend only sends floatId
    const f1 = firstFloat || floatId;
    const f2 = secondFloat || floatId;

    const buildQuery = (floatId: string) => {
      const selectFields = ["m.pres AS depth"];
      if (parameters.includes("temperature")) selectFields.push("m.temp AS temperature");
      if (parameters.includes("salinity")) selectFields.push("m.psal AS salinity");
      if (parameters.includes("pressure")) selectFields.push("m.pres AS pressure");

      const whereConditions: string[] = [
        "regexp_replace(p.platform_number, E'^b''(.*)''$', '\\1') = $1",
        "m.pres BETWEEN $2 AND $3",
      ];
      const queryParams: any[] = [floatId, depthRange[0], depthRange[1]];

      const paramIndex = 4;

      if (startDate && endDate) {
        whereConditions.push(`p.juld BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
        queryParams.push(startDate, endDate);
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

    const firstQuery = buildQuery(f1);
    const secondQuery = buildQuery(f2);

    console.log("[COMPARE FLOAT] First query:", firstQuery);
    console.log("[COMPARE FLOAT] Second query:", secondQuery);

    const [firstData, secondData] = await Promise.all([
      query(firstQuery.sql, firstQuery.params),
      query(secondQuery.sql, secondQuery.params),
    ]);
  // console.log("[COMPARE FLOAT] Data:", firstData, secondData);
    return NextResponse.json({
      firstFloat: { floatId: f1, data: firstData },
      secondFloat: { floatId: f2, data: secondData },
    });
  } catch (error: any) {
    console.error("[COMPARE FLOAT] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
