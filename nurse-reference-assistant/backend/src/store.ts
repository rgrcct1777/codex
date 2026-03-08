import fs from "node:fs/promises";
import path from "node:path";
import type { StoredDocument } from "./types.js";

const storePath = path.resolve(process.cwd(), "data/documents.json");

/**
 * Tiny local JSON store for private personal usage (v1 scope).
 * Swap this with a DB later without changing route contracts.
 */
export async function getDocuments(): Promise<StoredDocument[]> {
  await ensureStoreFile();
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as StoredDocument[];
}

export async function saveDocuments(documents: StoredDocument[]): Promise<void> {
  await ensureStoreFile();
  await fs.writeFile(storePath, JSON.stringify(documents, null, 2));
}

async function ensureStoreFile() {
  try {
    await fs.access(storePath);
  } catch {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.writeFile(storePath, "[]");
  }
}
