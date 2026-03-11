import { env } from "@/lib/env";

export function getAiKnowledgeTool() {
  if (!env.OPENAI_VECTOR_STORE_ID) return null;

  return {
    type: "file_search",
    vector_store_ids: [env.OPENAI_VECTOR_STORE_ID],
    max_num_results: 5
  };
}

export function isAiKnowledgeEnabled() {
  return Boolean(env.OPENAI_VECTOR_STORE_ID);
}
