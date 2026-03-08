import fs from "node:fs";
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

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: prompt,
    tools: [{ type: "file_search", vector_store_ids: [storeId] }],
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
  if (vectorStoreId) {
    return vectorStoreId;
  }

  const created = await client.vectorStores.create({
    name: "nurse-reference-assistant-private-store",
  });
  vectorStoreId = created.id;
  return vectorStoreId;
}
