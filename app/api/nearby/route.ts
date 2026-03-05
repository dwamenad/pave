import { NextRequest, NextResponse } from "next/server";
import { placesProvider } from "@/lib/providers";
import { budgetToPriceRange } from "@/lib/itinerary";

const quickTypes = {
  eat: ["restaurant"],
  coffee: ["cafe"],
  do: ["tourist_attraction", "park"]
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const price = budgetToPriceRange("mid");

  try {
    const [eat, coffee, quickDo] = await Promise.all([
      placesProvider.nearbySearch({ lat, lng, type: quickTypes.eat[0], radiusMeters: 2000, ...price }),
      placesProvider.nearbySearch({ lat, lng, type: quickTypes.coffee[0], radiusMeters: 2000, ...price }),
      placesProvider.nearbySearch({ lat, lng, type: quickTypes.do[0], radiusMeters: 2500, ...price })
    ]);

    return NextResponse.json({
      eat: eat.slice(0, 5),
      coffee: coffee.slice(0, 5),
      do: quickDo.slice(0, 5)
    });
  } catch (error) {
    console.error("Nearby provider unavailable", error);
    return NextResponse.json({
      eat: [],
      coffee: [],
      do: [],
      degraded: true
    });
  }
}
