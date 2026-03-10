import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { z } from "zod";
import type { QaResult, StoredDocument } from "./types.js";

const responseSchema = z.object({
  shortAnswer: z.string(),
  sources: z.array(
    z.object({
      filename: z.string(),
      excerpt: z.string(),
    }),
  ),
  usedFilenames: z.array(z.string()),
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
let vectorStoreId: string | null = null;
let hasLoadedPersistedVectorStoreId = false;
const vectorStoreStatePath = path.resolve(process.cwd(), "data/vectorStore.json");

export async function uploadToOpenAi(filename: string, filePath: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const file = await client.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });

  const storeId = await ensureVectorStore();
  await client.vectorStores.files.create(storeId, { file_id: file.id });

  return file.id;
}

export async function askFromDocuments(args: {
  question: string;
  preset: string | null;
  documents: StoredDocument[];
}): Promise<QaResult> {
  const { question, preset, documents } = args;
  const storeId = await ensureVectorStore();

  const prompt = [
    "You are Nurse Reference Assistant.",
    "This product is educational/reference only.",
    "Never provide diagnosis, treatment plans, medication dosing, or emergency decision-making.",
    "If asked for those, decline briefly and suggest checking current policy, physician orders, and clinical judgment.",
    preset ? `Preset action: ${preset}` : "No preset selected.",
    `Question: ${question}`,
    "Return strict JSON with keys: shortAnswer (string), sources([{filename, excerpt}]), usedFilenames(string[]).",
    "Keep shortAnswer concise and plain-English for a busy nurse.",
  ].join("\n");

  const fileSearchFilter = buildFileSearchFilter(documents);

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: prompt,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [storeId],
        ...(fileSearchFilter ? { filters: fileSearchFilter } : {}),
      },
    ],
  });

  const raw = response.output_text;

  try {
    const parsed = responseSchema.parse(JSON.parse(raw));
    if (parsed.usedFilenames.length === 0) {
      parsed.usedFilenames = documents.map((doc) => doc.filename);
    }
    return parsed;
  } catch {
    return {
      shortAnswer: raw || "No answer returned.",
      sources: [],
      usedFilenames: documents.map((doc) => doc.filename),
    };
  }
}

async function ensureVectorStore(): Promise<string> {
  await loadPersistedVectorStoreId();

  if (vectorStoreId) {
    try {
      await client.vectorStores.retrieve(vectorStoreId);
      return vectorStoreId;
    } catch {
      // Persisted IDs can go stale if a store is deleted/expired or the API key changes.
      // Reset and recreate so the service can recover automatically on next request.
      vectorStoreId = null;
    }
  }

  const created = await client.vectorStores.create({
    name: "nurse-reference-assistant-private-store",
  });
  vectorStoreId = created.id;
  await persistVectorStoreId(vectorStoreId);
  return vectorStoreId;
}

function buildFileSearchFilter(documents: StoredDocument[]) {
  const filters = documents.map((doc) => ({
    type: "eq" as const,
    key: "file_id",
    value: doc.openAiFileId,
  }));

  if (filters.length === 0) {
    return null;
  }

  return filters.length === 1 ? filters[0] : { type: "or" as const, filters };
}

async function loadPersistedVectorStoreId(): Promise<void> {
  if (hasLoadedPersistedVectorStoreId) {
    return;
  }

  hasLoadedPersistedVectorStoreId = true;

  try {
    const raw = await fsp.readFile(vectorStoreStatePath, "utf8");
    const parsed = JSON.parse(raw) as { vectorStoreId?: string };
    if (parsed.vectorStoreId?.trim()) {
      vectorStoreId = parsed.vectorStoreId;
    }
  } catch {
    // No persisted vector store yet; a new one will be created on first use.
  }
}

async function persistVectorStoreId(storeId: string): Promise<void> {
  await fsp.mkdir(path.dirname(vectorStoreStatePath), { recursive: true });
  await fsp.writeFile(vectorStoreStatePath, JSON.stringify({ vectorStoreId: storeId }, null, 2));
}
