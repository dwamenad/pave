import type { AiDraftFallbackReason } from "@pave/contracts";
import { z } from "zod";
import type { AiTripDraft } from "@pave/contracts";
import { findDuplicateDraftPlaceIds, getDraftPlaceIds } from "@/lib/server/trip-service";

export const aiCreatePreferencesSchema = z.object({
  budget: z.enum(["budget", "mid", "luxury"]),
  days: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  pace: z.enum(["slow", "balanced", "packed"]),
  vibeTags: z.array(z.string().trim().min(1).max(40)).max(12),
  dietary: z.array(z.string().trim().min(1).max(40)).max(8)
});

export const aiTripDraftItemSchema = z.object({
  placeId: z.string().trim().min(1),
  category: z.enum(["eat", "stay", "do"]),
  name: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(8).max(280),
  notes: z.string().trim().max(280).nullable().optional()
});

export const aiTripDraftDaySchema = z.object({
  dayIndex: z.number().int().min(1).max(3),
  title: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(8).max(220),
  items: z.array(aiTripDraftItemSchema).min(1).max(6)
});

export const aiTripDraftSchema = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(8).max(280),
  destination: z.object({
    placeId: z.string().trim().min(1),
    name: z.string().trim().min(1).max(120),
    lat: z.number(),
    lng: z.number(),
    address: z.string().trim().max(240).nullable().optional(),
    photoUrl: z.string().url().nullable().optional()
  }),
  days: z.array(aiTripDraftDaySchema).min(1).max(3)
});

export const aiTripDraftRequestSchema = z.object({
  caption: z.string().max(4000).default(""),
  links: z.array(z.string().url()).max(5).default([]),
  selectedPlaceId: z.string().trim().min(1),
  preferences: aiCreatePreferencesSchema
});

export const createTripFromDraftSchema = z.object({
  draft: aiTripDraftSchema,
  preferences: aiCreatePreferencesSchema,
  editedBeforeSave: z.boolean().optional().default(false)
});

export const aiTripDraftJsonSchema = {
  type: "json_schema",
  name: "pave_trip_draft",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "destination", "days"],
    properties: {
      title: { type: "string", minLength: 2, maxLength: 120 },
      summary: { type: "string", minLength: 8, maxLength: 280 },
      destination: {
        type: "object",
        additionalProperties: false,
        required: ["placeId", "name", "lat", "lng"],
        properties: {
          placeId: { type: "string", minLength: 1 },
          name: { type: "string", minLength: 1, maxLength: 120 },
          lat: { type: "number" },
          lng: { type: "number" },
          address: { type: ["string", "null"], maxLength: 240 },
          photoUrl: { type: ["string", "null"] }
        }
      },
      days: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["dayIndex", "title", "summary", "items"],
          properties: {
            dayIndex: { type: "integer", minimum: 1, maximum: 3 },
            title: { type: "string", minLength: 2, maxLength: 80 },
            summary: { type: "string", minLength: 8, maxLength: 220 },
            items: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["placeId", "category", "name", "rationale"],
                properties: {
                  placeId: { type: "string", minLength: 1 },
                  category: { type: "string", enum: ["eat", "stay", "do"] },
                  name: { type: "string", minLength: 1, maxLength: 120 },
                  rationale: { type: "string", minLength: 8, maxLength: 280 },
                  notes: { type: ["string", "null"], maxLength: 280 }
                }
              }
            }
          }
        }
      }
    }
  }
} as const;

export function validateResolvedDraft(input: {
  draft: AiTripDraft;
  expectedDays: number;
  destinationPlaceId: string;
  allowedPlaceIds: Set<string>;
}) {
  const duplicates = findDuplicateDraftPlaceIds(input.draft);
  if (duplicates.length) {
    return {
      ok: false as const,
      reason: "duplicate_places" as AiDraftFallbackReason,
      duplicates
    };
  }

  if (input.draft.destination.placeId !== input.destinationPlaceId) {
    return {
      ok: false as const,
      reason: "policy_invalid" as AiDraftFallbackReason
    };
  }

  if (input.draft.days.length !== input.expectedDays) {
    return {
      ok: false as const,
      reason: "policy_invalid" as AiDraftFallbackReason
    };
  }

  const unresolved = getDraftPlaceIds(input.draft).filter((placeId) => !input.allowedPlaceIds.has(placeId));
  if (unresolved.length) {
    return {
      ok: false as const,
      reason: "unresolved_places" as AiDraftFallbackReason,
      unresolved
    };
  }

  const stayCount = input.draft.days.flatMap((day) => day.items).filter((item) => item.category === "stay").length;
  if (stayCount > 1) {
    return {
      ok: false as const,
      reason: "policy_invalid" as AiDraftFallbackReason
    };
  }

  return {
    ok: true as const
  };
}
