export type StoredDocument = {
  id: string;
  filename: string;
  openAiFileId: string;
  uploadedAt: string;
};

export type QaResult = {
  shortAnswer: string;
  sources: Array<{ filename: string; excerpt: string }>;
  usedFilenames: string[];
};
