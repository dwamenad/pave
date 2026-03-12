import type { AiTripDraftRequest, AiTripDraftResponse, AiDraftFallbackReason } from "@pave/contracts";
import { env } from "@/lib/env";
import { getPlaceDetails } from "@/lib/server/place-service";
import { buildFallbackTripDraft } from "@/lib/server/trip-service";
import { OpenAIResponsesError, runResponseWithTools } from "@/lib/server/ai/client";
import { getAiKnowledgeTool } from "@/lib/server/ai/knowledge";
import { buildCreateSystemPrompt, buildCreateUserPrompt } from "@/lib/server/ai/prompt";
import { aiTripDraftJsonSchema, aiTripDraftSchema, validateResolvedDraft } from "@/lib/server/ai/schema";
import { executeAiCreateToolCall, getAiCreateToolDefinitions } from "@/lib/server/ai/tools";

function classifyDraftFailure(error: unknown): AiDraftFallbackReason {
  if (error instanceof DOMException && error.name === "AbortError") return "model_timeout";
  if (error instanceof OpenAIResponsesError) {
    if (error.status === 408 || error.status === 429 || error.status >= 500) {
      return "model_timeout";
    }
    return "model_error";
  }

  return "model_error";
}

type GenerateAiTripDraftDeps = {
  env?: Partial<Pick<typeof env, "ENABLE_AI_CREATE" | "OPENAI_API_KEY" | "OPENAI_RESPONSES_MODEL">>;
  getPlaceDetails?: typeof getPlaceDetails;
  buildFallbackTripDraft?: typeof buildFallbackTripDraft;
  runResponseWithTools?: typeof runResponseWithTools;
  getAiKnowledgeTool?: typeof getAiKnowledgeTool;
  getAiCreateToolDefinitions?: typeof getAiCreateToolDefinitions;
  executeAiCreateToolCall?: typeof executeAiCreateToolCall;
};

export async function generateAiTripDraft(input: {
  request: AiTripDraftRequest;
  requesterUserId?: string | null;
}, deps: GenerateAiTripDraftDeps = {}): Promise<AiTripDraftResponse> {
  const startedAt = Date.now();
  const signedIn = Boolean(input.requesterUserId);
  const runtimeEnv = {
    ENABLE_AI_CREATE: deps.env?.ENABLE_AI_CREATE ?? env.ENABLE_AI_CREATE,
    OPENAI_API_KEY: deps.env?.OPENAI_API_KEY ?? env.OPENAI_API_KEY,
    OPENAI_RESPONSES_MODEL: deps.env?.OPENAI_RESPONSES_MODEL ?? env.OPENAI_RESPONSES_MODEL
  };
  const getPlaceDetailsFn = deps.getPlaceDetails ?? getPlaceDetails;
  const buildFallbackTripDraftFn = deps.buildFallbackTripDraft ?? buildFallbackTripDraft;
  const runResponseWithToolsFn = deps.runResponseWithTools ?? runResponseWithTools;
  const getAiKnowledgeToolFn = deps.getAiKnowledgeTool ?? getAiKnowledgeTool;
  const getAiCreateToolDefinitionsFn = deps.getAiCreateToolDefinitions ?? getAiCreateToolDefinitions;
  const executeAiCreateToolCallFn = deps.executeAiCreateToolCall ?? executeAiCreateToolCall;
  const destinationResult = await getPlaceDetailsFn(input.request.selectedPlaceId);
  const destination = destinationResult.data;

  if (!destinationResult.ok || !destination) {
    const fallbackReason =
      destinationResult.reasonCode && destinationResult.reasonCode !== "no_results"
        ? "provider_unavailable"
        : "missing_place";
    return {
      generationMode: "fallback",
      fallbackReason,
      draft: await buildFallbackTripDraftFn({
        placeId: input.request.selectedPlaceId,
        title: "Recovered trip draft",
        centerLat: 0,
        centerLng: 0,
        preferences: input.request.preferences
      }),
      telemetry: {
        model: runtimeEnv.OPENAI_RESPONSES_MODEL,
        latencyMs: Date.now() - startedAt,
        toolCount: 0,
        retrievalUsed: false,
        signedIn
      },
      provider: {
        reasonCode: destinationResult.reasonCode,
        cacheState: destinationResult.cacheState,
        mockMode: destinationResult.mockMode
      }
    };
  }

  const buildFallback = async (reason: AiDraftFallbackReason): Promise<AiTripDraftResponse> => ({
    generationMode: "fallback",
    fallbackReason: reason,
    draft: await buildFallbackTripDraftFn({
      placeId: destination.placeId,
      title: `${destination.name} Social Plan`,
      centerLat: destination.lat,
      centerLng: destination.lng,
      preferences: input.request.preferences,
      destinationName: destination.name,
      destinationAddress: destination.address ?? null,
      destinationPhotoUrl: destination.photoUrl ?? null
    }),
    telemetry: {
      model: runtimeEnv.OPENAI_RESPONSES_MODEL,
      latencyMs: Date.now() - startedAt,
      toolCount: 0,
      retrievalUsed: false,
      signedIn
    },
    provider: {
      reasonCode: destinationResult.reasonCode,
      cacheState: destinationResult.cacheState,
      mockMode: destinationResult.mockMode
    }
  });

  if (!runtimeEnv.ENABLE_AI_CREATE || !runtimeEnv.OPENAI_API_KEY) {
    return buildFallback("ai_disabled");
  }

  const knownPlaces = new Map([[destination.placeId, destination]]);
  const tools: unknown[] = [...getAiCreateToolDefinitionsFn()];
  const knowledgeTool = getAiKnowledgeToolFn();
  if (knowledgeTool) {
    tools.push(knowledgeTool);
  }

  try {
    const response = await runResponseWithToolsFn({
      systemPrompt: buildCreateSystemPrompt(),
      userPrompt: buildCreateUserPrompt(input.request),
      tools,
      textFormat: aiTripDraftJsonSchema,
      onFunctionCall: async (call) =>
        executeAiCreateToolCallFn({
          name: call.name,
          rawArguments: call.arguments,
          context: {
            userId: input.requesterUserId,
            knownPlaces
          }
        })
    });

    const parsed = aiTripDraftSchema.parse(JSON.parse(response.outputText));
    const validation = validateResolvedDraft({
      draft: parsed,
      expectedDays: input.request.preferences.days,
      destinationPlaceId: destination.placeId,
      allowedPlaceIds: new Set(knownPlaces.keys())
    });

    if (!validation.ok) {
      return buildFallback(validation.reason);
    }

    const canonicalDraft = {
      ...parsed,
      destination: {
        placeId: destination.placeId,
        name: destination.name,
        lat: destination.lat,
        lng: destination.lng,
        address: destination.address ?? null,
        photoUrl: destination.photoUrl ?? null
      },
      days: parsed.days.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          const place = knownPlaces.get(item.placeId);
          return {
            ...item,
            name: place?.name || item.name,
            notes: item.notes ?? place?.address ?? null
          };
        })
      }))
    };

    return {
      generationMode: "ai",
      draft: canonicalDraft,
      telemetry: {
        model: response.model,
        latencyMs: Date.now() - startedAt,
        toolCount: response.toolCount,
        retrievalUsed: response.retrievalUsed,
        signedIn
      },
      provider: {
        reasonCode: destinationResult.reasonCode,
        cacheState: destinationResult.cacheState,
        mockMode: destinationResult.mockMode
      }
    };
  } catch (error) {
    return buildFallback(classifyDraftFailure(error));
  }
}
