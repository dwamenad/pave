import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const knowledgeDir = path.join(process.cwd(), "docs", "ai-knowledge");

async function uploadKnowledgeFile(filePath: string, apiKey: string, vectorStoreId: string) {
  const contents = await readFile(filePath);
  const filename = path.basename(filePath);

  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("file", new File([contents], filename, { type: "text/markdown" }));

  const upload = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!upload.ok) {
    throw new Error(`Failed to upload ${filename}: ${await upload.text()}`);
  }

  const uploaded = (await upload.json()) as { id: string };

  const attach = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      file_id: uploaded.id
    })
  });

  if (!attach.ok) {
    throw new Error(`Failed to attach ${filename}: ${await attach.text()}`);
  }

  const attachment = (await attach.json()) as { id: string };
  return {
    filename,
    fileId: uploaded.id,
    vectorFileId: attachment.id
  };
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey || !vectorStoreId) {
    throw new Error("OPENAI_API_KEY and OPENAI_VECTOR_STORE_ID are required.");
  }

  const files = (await readdir(knowledgeDir))
    .filter((file) => file.endsWith(".md"))
    .map((file) => path.join(knowledgeDir, file));

  if (!files.length) {
    throw new Error(`No markdown files found in ${knowledgeDir}`);
  }

  console.log(`Syncing ${files.length} knowledge file(s) to vector store ${vectorStoreId}...`);

  for (const filePath of files) {
    const result = await uploadKnowledgeFile(filePath, apiKey, vectorStoreId);
    console.log(`Uploaded ${result.filename} -> file ${result.fileId}, vector file ${result.vectorFileId}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
