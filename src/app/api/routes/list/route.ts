import { NextResponse, NextRequest } from "next/server";
import { getAllRoutes } from "@/lib/db/routes";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get("locale") || "en") as "en" | "kr";
    
    const routes = await getAllRoutes({ limit: 15, locale });
    return NextResponse.json(routes);
  } catch (error) {
    console.error("[/api/routes/list] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}





