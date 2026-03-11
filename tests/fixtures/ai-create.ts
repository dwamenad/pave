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
    caption: "Couple visiting Paris for a short luxury anniversary trip with one standout dinner.",
    selectedPlaceId: "dest_paris",
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
    selectedPlaceId: "dest_barcelona",
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
    caption: "Slow, culture-heavy itinerary in Kyoto with tea houses, temples, and downtime.",
    selectedPlaceId: "dest_kyoto",
    preferences: {
      budget: "mid",
      days: 3,
      pace: "slow",
      vibeTags: ["culture", "calm", "heritage"],
      dietary: []
    }
  }
] as const;
