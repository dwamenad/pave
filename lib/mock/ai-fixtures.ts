import type { AiTripDraft } from "@pave/contracts";

export const aiCreateEvalFixtures = [
  {
    key: "solo-foodie-weekend",
    caption: "Solo weekend in Lisbon focused on pastries, markets, and one scenic evening stop.",
    selectedPlaceId: "dest_lisbon",
    preferences: {
      budget: "mid",
      days: 2,
      pace: "balanced",
      vibeTags: ["food", "markets", "views"],
      dietary: []
    }
  },
  {
    key: "couple-luxury-city-break",
    caption: "Couple visiting Lisbon for a short luxury anniversary trip with one standout dinner.",
    selectedPlaceId: "dest_lisbon",
    preferences: {
      budget: "luxury",
      days: 2,
      pace: "slow",
      vibeTags: ["romantic", "luxury", "culture"],
      dietary: []
    }
  },
  {
    key: "mixed-group-trip",
    caption: "Three friends in Tokyo: one vegetarian, one nightlife heavy, one museum oriented.",
    selectedPlaceId: "dest_tokyo",
    preferences: {
      budget: "mid",
      days: 3,
      pace: "balanced",
      vibeTags: ["group", "food", "nightlife", "culture"],
      dietary: ["vegetarian"]
    }
  },
  {
    key: "packed-budget-trip",
    caption: "Fast low-budget city break with high stop density and mostly free activities.",
    selectedPlaceId: "dest_mexicocity",
    preferences: {
      budget: "budget",
      days: 3,
      pace: "packed",
      vibeTags: ["budget", "views", "walking"],
      dietary: []
    }
  },
  {
    key: "slow-culture-trip",
    caption: "Slow, culture-heavy itinerary in Lisbon with museums, coffee, and downtime.",
    selectedPlaceId: "dest_lisbon",
    preferences: {
      budget: "mid",
      days: 3,
      pace: "slow",
      vibeTags: ["culture", "calm", "heritage"],
      dietary: []
    }
  }
] as const;

export const mockSocialParseMetadata = [
  {
    title: "48 hours in Lisbon for food lovers",
    url: "https://example.com/lisbon-food-guide",
    description: "A quick social-style roundup of pastry stops, markets, and scenic viewpoints in Lisbon.",
    parsedHints: ["Lisbon", "food", "viewpoints"]
  },
  {
    title: "Tokyo neighborhood coffee and culture thread",
    url: "https://example.com/tokyo-coffee-culture",
    description: "Saved guide with Omotesando cafes, museums, and walkable Tokyo neighborhoods.",
    parsedHints: ["Tokyo", "coffee", "culture"]
  }
] as const;

export const mockAiDraftFixture: AiTripDraft = {
  title: "Lisbon Social Plan",
  summary: "A balanced 2-day city plan built from social travel inspiration and clustered around Lisbon highlights.",
  destination: {
    placeId: "dest_lisbon",
    name: "Lisbon",
    lat: 38.7223,
    lng: -9.1393,
    address: "Lisbon, Portugal",
    photoUrl: null
  },
  days: [
    {
      dayIndex: 1,
      title: "Arrival and market circuit",
      summary: "Start with classic Lisbon food stops and an easy first-night viewpoint.",
      items: [
        {
          placeId: "lisbon_timeout_market",
          category: "eat",
          name: "Time Out Market Lisbon",
          rationale: "Easy first stop with plenty of options and strong social proof.",
          notes: "Best for a flexible first meal after arrival."
        },
        {
          placeId: "lisbon_miradouro_santa_luzia",
          category: "do",
          name: "Miradouro de Santa Luzia",
          rationale: "High-rated scenic stop that keeps the route compact.",
          notes: "Good golden-hour view."
        }
      ]
    },
    {
      dayIndex: 2,
      title: "Coffee, tiles, and dinner",
      summary: "Keep the final day walkable with one museum anchor and two reliable food stops.",
      items: [
        {
          placeId: "lisbon_pastel_club",
          category: "eat",
          name: "Pastel Club Lisbon",
          rationale: "Strong pastry stop for a slower start.",
          notes: null
        },
        {
          placeId: "lisbon_tile_museum",
          category: "do",
          name: "National Tile Museum",
          rationale: "Adds a cultural anchor without pulling the route too far apart.",
          notes: null
        },
        {
          placeId: "lisbon_cervejaria_ramiro",
          category: "eat",
          name: "Cervejaria Ramiro",
          rationale: "Caps the trip with a standout dinner destination.",
          notes: "Book ahead when possible."
        }
      ]
    }
  ]
};
