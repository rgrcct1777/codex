import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { askFromDocuments, uploadToOpenAi } from "./openaiService.js";
import { getDocuments, saveDocuments } from "./store.js";

const app = express();
const upload = multer({ dest: path.resolve(process.cwd(), "uploads") });
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/documents", async (_req, res) => {
  const documents = await getDocuments();
  res.json({ documents: documents.map(({ id, filename, uploadedAt }) => ({ id, filename, uploadedAt })) });
});

/**
 * Upload route: file goes to OpenAI file storage + vector store.
 * API keys remain server-side only.
 */
app.post("/documents/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  try {
    if (!file || file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Please upload a PDF." });
      return;
    }

    const openAiFileId = await uploadToOpenAi(file.originalname, file.path);
    const documents = await getDocuments();

    documents.push({
      id: randomUUID(),
      filename: file.originalname,
      openAiFileId,
      uploadedAt: new Date().toISOString(),
    });

    await saveDocuments(documents);
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Failed to upload document", error);
    res.status(500).json({ error: "Failed to upload document." });
  } finally {
    if (file?.path) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error("Failed to remove temporary upload", unlinkError);
      }
    }
  }
});

app.post("/qa/ask", async (req, res) => {
  const { question, preset, documentIds } = req.body as {
    question?: string;
    preset?: string | null;
    documentIds?: string[];
  };

  if (!question?.trim()) {
    res.status(400).json({ error: "Question is required." });
    return;
  }

  const allDocuments = await getDocuments();
  const selectedDocuments =
    documentIds && documentIds.length > 0
      ? allDocuments.filter((doc) => documentIds.includes(doc.id))
      : allDocuments;

  if (selectedDocuments.length === 0) {
    res.status(400).json({ error: "Upload at least one document first." });
    return;
  }

  const result = await askFromDocuments({
    question,
    preset: preset ?? null,
    documents: selectedDocuments,
  });

  res.json({ result });
});

app.listen(port, () => {
  console.log(`Nurse Reference Assistant backend running on http://localhost:${port}`);
});
