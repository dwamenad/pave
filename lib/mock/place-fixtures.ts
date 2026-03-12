import type { NearbySearchInput, PlaceDetails } from "@/lib/types";

export type MockCityKey = "lisbon" | "tokyo" | "mexico_city";
export type MockPlaceBucket = "destination" | "eat" | "stay" | "do";

function place(input: PlaceDetails & { city: MockCityKey; bucket: MockPlaceBucket }) {
  return input;
}

const mockPlaces = [
  place({ city: "lisbon", bucket: "destination", placeId: "dest_lisbon", name: "Lisbon", lat: 38.7223, lng: -9.1393, rating: 4.8, userRatingsTotal: 12400, priceLevel: 2, openNow: true, address: "Lisbon, Portugal", photoUrl: undefined, types: ["locality", "political"] }),
  place({ city: "lisbon", bucket: "eat", placeId: "lisbon_pastel_club", name: "Pastel Club Lisbon", lat: 38.7136, lng: -9.1415, rating: 4.7, userRatingsTotal: 1890, priceLevel: 1, openNow: true, address: "Rua Augusta 41, Lisbon", photoUrl: undefined, types: ["bakery", "cafe"] }),
  place({ city: "lisbon", bucket: "eat", placeId: "lisbon_timeout_market", name: "Time Out Market Lisbon", lat: 38.7078, lng: -9.1467, rating: 4.6, userRatingsTotal: 8210, priceLevel: 2, openNow: true, address: "Av. 24 de Julho 49, Lisbon", photoUrl: undefined, types: ["restaurant", "meal_takeaway"] }),
  place({ city: "lisbon", bucket: "eat", placeId: "lisbon_cervejaria_ramiro", name: "Cervejaria Ramiro", lat: 38.7206, lng: -9.1356, rating: 4.6, userRatingsTotal: 6120, priceLevel: 3, openNow: true, address: "Av. Almirante Reis 1, Lisbon", photoUrl: undefined, types: ["restaurant"] }),
  place({ city: "lisbon", bucket: "stay", placeId: "lisbon_memmo_alfama", name: "Memmo Alfama", lat: 38.7111, lng: -9.1296, rating: 4.8, userRatingsTotal: 940, priceLevel: 3, openNow: true, address: "Travessa das Merceeiras 27, Lisbon", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "lisbon", bucket: "stay", placeId: "lisbon_bairro_alto_hotel", name: "Bairro Alto Hotel", lat: 38.7104, lng: -9.1459, rating: 4.7, userRatingsTotal: 730, priceLevel: 4, openNow: true, address: "Praca Luis de Camoes 2, Lisbon", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "lisbon", bucket: "do", placeId: "lisbon_miradouro_santa_luzia", name: "Miradouro de Santa Luzia", lat: 38.7118, lng: -9.1292, rating: 4.8, userRatingsTotal: 9600, priceLevel: 0, openNow: true, address: "Largo de Santa Luzia, Lisbon", photoUrl: undefined, types: ["tourist_attraction", "park"] }),
  place({ city: "lisbon", bucket: "do", placeId: "lisbon_lx_factory", name: "LX Factory", lat: 38.7035, lng: -9.1782, rating: 4.5, userRatingsTotal: 13400, priceLevel: 1, openNow: true, address: "R. Rodrigues de Faria 103, Lisbon", photoUrl: undefined, types: ["tourist_attraction", "art_gallery"] }),
  place({ city: "lisbon", bucket: "do", placeId: "lisbon_tile_museum", name: "National Tile Museum", lat: 38.7245, lng: -9.1138, rating: 4.6, userRatingsTotal: 4200, priceLevel: 1, openNow: true, address: "Rua da Madre de Deus 4, Lisbon", photoUrl: undefined, types: ["museum", "tourist_attraction"] }),
  place({ city: "tokyo", bucket: "destination", placeId: "dest_tokyo", name: "Tokyo", lat: 35.6762, lng: 139.6503, rating: 4.9, userRatingsTotal: 23100, priceLevel: 2, openNow: true, address: "Tokyo, Japan", photoUrl: undefined, types: ["locality", "political"] }),
  place({ city: "tokyo", bucket: "eat", placeId: "tokyo_sushi_dai", name: "Sushi Dai Central", lat: 35.6655, lng: 139.7708, rating: 4.7, userRatingsTotal: 2800, priceLevel: 3, openNow: true, address: "Tsukiji District, Tokyo", photoUrl: undefined, types: ["restaurant"] }),
  place({ city: "tokyo", bucket: "eat", placeId: "tokyo_koffee_mameya", name: "Koffee Mameya Notes", lat: 35.6695, lng: 139.7043, rating: 4.8, userRatingsTotal: 1500, priceLevel: 2, openNow: true, address: "Omotesando, Tokyo", photoUrl: undefined, types: ["cafe"] }),
  place({ city: "tokyo", bucket: "eat", placeId: "tokyo_ichi_ramen", name: "Ichi Ramen Shibuya", lat: 35.6592, lng: 139.7006, rating: 4.5, userRatingsTotal: 4100, priceLevel: 1, openNow: true, address: "Shibuya, Tokyo", photoUrl: undefined, types: ["restaurant", "meal_takeaway"] }),
  place({ city: "tokyo", bucket: "stay", placeId: "tokyo_cerulean_tower", name: "Cerulean Tower Stay", lat: 35.6578, lng: 139.6992, rating: 4.6, userRatingsTotal: 2100, priceLevel: 4, openNow: true, address: "Shibuya, Tokyo", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "tokyo", bucket: "stay", placeId: "tokyo_asakusa_hideout", name: "Asakusa Hideout Hotel", lat: 35.7122, lng: 139.7982, rating: 4.4, userRatingsTotal: 980, priceLevel: 2, openNow: true, address: "Asakusa, Tokyo", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "tokyo", bucket: "do", placeId: "tokyo_sensoji", name: "Senso-ji Temple", lat: 35.7148, lng: 139.7967, rating: 4.8, userRatingsTotal: 20200, priceLevel: 0, openNow: true, address: "2-3-1 Asakusa, Tokyo", photoUrl: undefined, types: ["tourist_attraction", "museum"] }),
  place({ city: "tokyo", bucket: "do", placeId: "tokyo_meiji_jingu", name: "Meiji Jingu", lat: 35.6764, lng: 139.6993, rating: 4.8, userRatingsTotal: 17800, priceLevel: 0, openNow: true, address: "1-1 Yoyogikamizonocho, Tokyo", photoUrl: undefined, types: ["park", "tourist_attraction"] }),
  place({ city: "tokyo", bucket: "do", placeId: "tokyo_teamlab_borderless", name: "teamLab Borderless", lat: 35.6259, lng: 139.775, rating: 4.7, userRatingsTotal: 9700, priceLevel: 3, openNow: true, address: "Azabudai Hills, Tokyo", photoUrl: undefined, types: ["museum", "art_gallery"] }),
  place({ city: "mexico_city", bucket: "destination", placeId: "dest_mexicocity", name: "Mexico City", lat: 19.4326, lng: -99.1332, rating: 4.8, userRatingsTotal: 17800, priceLevel: 2, openNow: true, address: "Mexico City, Mexico", photoUrl: undefined, types: ["locality", "political"] }),
  place({ city: "mexico_city", bucket: "eat", placeId: "cdmx_contramar", name: "Contramar", lat: 19.4251, lng: -99.1697, rating: 4.7, userRatingsTotal: 5400, priceLevel: 3, openNow: true, address: "Durango 200, Roma Norte", photoUrl: undefined, types: ["restaurant"] }),
  place({ city: "mexico_city", bucket: "eat", placeId: "cdmx_cafe_avellaneda", name: "Cafe Avellaneda", lat: 19.3521, lng: -99.1626, rating: 4.8, userRatingsTotal: 1300, priceLevel: 1, openNow: true, address: "Higuera 40, Coyoacan", photoUrl: undefined, types: ["cafe"] }),
  place({ city: "mexico_city", bucket: "eat", placeId: "cdmx_azul_historico", name: "Azul Historico", lat: 19.4324, lng: -99.1386, rating: 4.5, userRatingsTotal: 6900, priceLevel: 2, openNow: true, address: "Isabel la Catolica 30, Centro", photoUrl: undefined, types: ["restaurant", "meal_takeaway"] }),
  place({ city: "mexico_city", bucket: "stay", placeId: "cdmx_casa_polanco", name: "Casa Polanco", lat: 19.4307, lng: -99.193, rating: 4.8, userRatingsTotal: 410, priceLevel: 4, openNow: true, address: "Polanco, Mexico City", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "mexico_city", bucket: "stay", placeId: "cdmx_casa_pepe", name: "Casa Pepe Downtown", lat: 19.4322, lng: -99.1304, rating: 4.6, userRatingsTotal: 1220, priceLevel: 1, openNow: true, address: "Centro, Mexico City", photoUrl: undefined, types: ["lodging"] }),
  place({ city: "mexico_city", bucket: "do", placeId: "cdmx_frida_kahlo", name: "Frida Kahlo Museum", lat: 19.3554, lng: -99.1626, rating: 4.7, userRatingsTotal: 18800, priceLevel: 1, openNow: true, address: "Londres 247, Coyoacan", photoUrl: undefined, types: ["museum", "tourist_attraction"] }),
  place({ city: "mexico_city", bucket: "do", placeId: "cdmx_bosque_chapultepec", name: "Bosque de Chapultepec", lat: 19.4195, lng: -99.1898, rating: 4.8, userRatingsTotal: 22400, priceLevel: 0, openNow: true, address: "Chapultepec, Mexico City", photoUrl: undefined, types: ["park", "tourist_attraction"] }),
  place({ city: "mexico_city", bucket: "do", placeId: "cdmx_palacio_bellas_artes", name: "Palacio de Bellas Artes", lat: 19.4352, lng: -99.1412, rating: 4.8, userRatingsTotal: 44700, priceLevel: 1, openNow: true, address: "Av. Juarez, Centro", photoUrl: undefined, types: ["art_gallery", "museum", "tourist_attraction"] })
] as const;

export const MOCK_PLACE_DETAILS = new Map<string, PlaceDetails>(mockPlaces.map((item) => [item.placeId, item]));

const DESTINATION_BY_CITY: Record<MockCityKey, PlaceDetails> = {
  lisbon: MOCK_PLACE_DETAILS.get("dest_lisbon")!,
  tokyo: MOCK_PLACE_DETAILS.get("dest_tokyo")!,
  mexico_city: MOCK_PLACE_DETAILS.get("dest_mexicocity")!
};

export const MOCK_NEARBY_RESULTS: Record<MockCityKey, Record<MockPlaceBucket, PlaceDetails[]>> = {
  lisbon: {
    destination: [DESTINATION_BY_CITY.lisbon],
    eat: mockPlaces.filter((item) => item.city === "lisbon" && item.bucket === "eat"),
    stay: mockPlaces.filter((item) => item.city === "lisbon" && item.bucket === "stay"),
    do: mockPlaces.filter((item) => item.city === "lisbon" && item.bucket === "do")
  },
  tokyo: {
    destination: [DESTINATION_BY_CITY.tokyo],
    eat: mockPlaces.filter((item) => item.city === "tokyo" && item.bucket === "eat"),
    stay: mockPlaces.filter((item) => item.city === "tokyo" && item.bucket === "stay"),
    do: mockPlaces.filter((item) => item.city === "tokyo" && item.bucket === "do")
  },
  mexico_city: {
    destination: [DESTINATION_BY_CITY.mexico_city],
    eat: mockPlaces.filter((item) => item.city === "mexico_city" && item.bucket === "eat"),
    stay: mockPlaces.filter((item) => item.city === "mexico_city" && item.bucket === "stay"),
    do: mockPlaces.filter((item) => item.city === "mexico_city" && item.bucket === "do")
  }
};

export const MOCK_PLACE_SUGGESTIONS = [
  { placeId: "dest_lisbon", text: "Lisbon, Portugal" },
  { placeId: "dest_tokyo", text: "Tokyo, Japan" },
  { placeId: "dest_mexicocity", text: "Mexico City, Mexico" }
] as const;

const TYPE_TO_BUCKET: Record<string, MockPlaceBucket | undefined> = {
  locality: "destination",
  political: "destination",
  restaurant: "eat",
  cafe: "eat",
  meal_takeaway: "eat",
  bakery: "eat",
  lodging: "stay",
  tourist_attraction: "do",
  museum: "do",
  park: "do",
  art_gallery: "do"
};

function cityDistanceScore(centerLat: number, centerLng: number, place: PlaceDetails) {
  return Math.abs(centerLat - place.lat) + Math.abs(centerLng - place.lng);
}

export function getMockPlaceById(placeId: string) {
  return MOCK_PLACE_DETAILS.get(placeId) ?? null;
}

export function searchMockPlaces(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return MOCK_PLACE_SUGGESTIONS.filter((item) => item.text.toLowerCase().includes(normalized)).slice(0, 5);
}

export function getMockNearbyResults(input: NearbySearchInput) {
  const bucket = TYPE_TO_BUCKET[input.type] ?? "do";
  const cityKey = (Object.keys(DESTINATION_BY_CITY) as MockCityKey[]).sort((a, b) => {
    const aDistance = cityDistanceScore(input.lat, input.lng, DESTINATION_BY_CITY[a]);
    const bDistance = cityDistanceScore(input.lat, input.lng, DESTINATION_BY_CITY[b]);
    return aDistance - bDistance;
  })[0];

  return MOCK_NEARBY_RESULTS[cityKey][bucket]
    .filter((place) => {
      if (input.minPrice === undefined || input.maxPrice === undefined || place.priceLevel === undefined) {
        return true;
      }
      return place.priceLevel >= input.minPrice && place.priceLevel <= input.maxPrice;
    })
    .slice(0, 20);
}

export const MOCK_DESTINATION_IDS = Object.values(DESTINATION_BY_CITY).map((item) => item.placeId);
