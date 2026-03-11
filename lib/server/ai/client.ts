import { env } from "@/lib/env";

type ResponsesCreateBody = {
  model: string;
  input: unknown;
  tools?: unknown[];
  text?: unknown;
  max_output_tokens?: number;
  previous_response_id?: string;
};

type FunctionCallOutput = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

type OpenAIResponseOutput = {
  type?: string;
  id?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  [key: string]: unknown;
};

type OpenAIResponsePayload = {
  id: string;
  output_text?: string;
  output?: OpenAIResponseOutput[];
};

export class OpenAIResponsesError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenAIResponsesError";
    this.status = status;
  }
}

function hasFileSearchUsage(output: OpenAIResponseOutput[] | undefined) {
  return (output || []).some((item) => `${item.type || ""}`.includes("file_search"));
}

function countToolCalls(output: OpenAIResponseOutput[] | undefined) {
  return (output || []).filter((item) => item.type === "function_call" || `${item.type || ""}`.includes("file_search")).length;
}

function extractFunctionCalls(output: OpenAIResponseOutput[] | undefined) {
  return (output || [])
    .filter((item) => item.type === "function_call" && typeof item.call_id === "string" && typeof item.name === "string")
    .map((item) => ({
      callId: item.call_id as string,
      name: item.name as string,
      arguments: typeof item.arguments === "string" ? item.arguments : "{}"
    }));
}

function getResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const messageOutput = (payload.output || []).find((item) => item.type === "message");
  if (messageOutput && typeof messageOutput.content === "object" && Array.isArray(messageOutput.content)) {
    const textItem = messageOutput.content.find((contentItem: { type?: string; text?: string }) => contentItem.type === "output_text");
    if (textItem?.text) return textItem.text;
  }

  throw new Error("OpenAI response did not include output text.");
}

async function createOpenAIResponse(body: ResponsesCreateBody) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new OpenAIResponsesError(text || "OpenAI Responses API request failed.", response.status);
    }

    return (await response.json()) as OpenAIResponsePayload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runResponseWithTools(input: {
  systemPrompt: string;
  userPrompt: string;
  tools: unknown[];
  textFormat: unknown;
  onFunctionCall: (call: { name: string; arguments: string }) => Promise<unknown>;
}) {
  const model = env.OPENAI_RESPONSES_MODEL;
  let response = await createOpenAIResponse({
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: input.systemPrompt }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: input.userPrompt }]
      }
    ],
    tools: input.tools,
    text: { format: input.textFormat },
    max_output_tokens: 2200
  });

  let toolCount = countToolCalls(response.output);
  let retrievalUsed = hasFileSearchUsage(response.output);

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const functionCalls = extractFunctionCalls(response.output);
    if (!functionCalls.length) {
      return {
        model,
        toolCount,
        retrievalUsed,
        outputText: getResponseText(response)
      };
    }

    const toolOutputs: FunctionCallOutput[] = [];
    for (const call of functionCalls) {
      const output = await input.onFunctionCall({
        name: call.name,
        arguments: call.arguments
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: call.callId,
        output: JSON.stringify(output)
      });
    }

    response = await createOpenAIResponse({
      model,
      previous_response_id: response.id,
      input: toolOutputs,
      tools: input.tools,
      text: { format: input.textFormat },
      max_output_tokens: 2200
    });

    toolCount += countToolCalls(response.output);
    retrievalUsed = retrievalUsed || hasFileSearchUsage(response.output);
  }

  throw new Error("OpenAI response exceeded maximum tool iterations.");
}
