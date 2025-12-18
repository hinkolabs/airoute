import { NextResponse } from "next/server";
import { getAllRoutes } from "@/lib/db/routes";

export async function GET() {
  try {
    const routes = await getAllRoutes();
    return NextResponse.json(routes);
  } catch (error) {
    console.error("[/api/routes/list] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}

