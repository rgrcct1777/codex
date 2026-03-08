import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type UploadedDocument = {
  id: string;
  filename: string;
  uploadedAt: string;
};

type SourceExcerpt = {
  filename: string;
  excerpt: string;
};

type QaResult = {
  shortAnswer: string;
  sources: SourceExcerpt[];
  usedFilenames: string[];
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const PRESETS = [
  "Make study guide",
  "Create patient education handout",
  "Compare 2 documents",
  "Quiz me",
  "Shift cheat sheet",
] as const;

/**
 * iPhone-first nurse study/reference app.
 * Keep this screen plain-English, high contrast, and low-clutter.
 */
export default function App() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [result, setResult] = useState<QaResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const canAsk = useMemo(
    () => question.trim().length > 0 && (selectedIds.length > 0 || documents.length > 0),
    [question, selectedIds.length, documents.length],
  );

  async function refreshDocuments() {
    const response = await fetch(`${API_BASE_URL}/documents`);
    const payload = (await response.json()) as { documents: UploadedDocument[] };
    setDocuments(payload.documents);
  }

  async function uploadPdf() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (picked.canceled) {
      return;
    }

    const file = picked.assets[0];
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/pdf",
    } as never);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      await refreshDocuments();
      Alert.alert("Upload complete", `${file.name} is ready for questions.`);
    } catch (error) {
      Alert.alert("Upload problem", "Could not upload this PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function askQuestion() {
    setIsAsking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/qa/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          preset: selectedPreset,
          documentIds: selectedIds.length > 0 ? selectedIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Question failed");
      }

      const payload = (await response.json()) as { result: QaResult };
      setResult(payload.result);
    } catch {
      Alert.alert("Question problem", "Could not generate an answer right now.");
    } finally {
      setIsAsking(false);
    }
  }

  async function exportResult() {
    if (!result) {
      return;
    }

    const exportText = [
      `Short answer:\n${result.shortAnswer}`,
      "",
      "Sources:",
      ...result.sources.map((source) => `- ${source.filename}: ${source.excerpt}`),
    ].join("\n");

    await Share.share({
      title: "Nurse Reference Assistant export",
      message: exportText,
    });
  }

  function toggleDocSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nurse Reference Assistant</Text>
        <Text style={styles.subtitle}>Your private study and reference helper for nursing PDFs.</Text>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            For education and reference only. Verify against current policy, physician orders, and your
            clinical judgment.
          </Text>
          <Text style={styles.bannerReminder}>Never upload real patient data (no PHI).</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={uploadPdf}>
          <Text style={styles.primaryButtonText}>{isUploading ? "Uploading…" : "Upload PDF"}</Text>
        </Pressable>

        {documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Start here</Text>
            <Text style={styles.emptyStateText}>
              1) Tap Upload PDF. 2) Select a study/reference PDF from your phone. 3) Ask a question
              below.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded documents</Text>
            <FlatList
              data={documents}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() => toggleDocSelection(item.id)}
                    style={[styles.docCard, selected && styles.docCardSelected]}
                  >
                    <Text style={styles.docFilename}>{item.filename}</Text>
                    <Text style={styles.docMeta}>{selected ? "Selected" : "Tap to include"}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preset actions</Text>
          <View style={styles.presetRow}>
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setSelectedPreset(isSelected ? null : preset)}
                  style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                >
                  <Text style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}>
                    {preset}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask about your PDFs</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Example: Summarize stroke assessment priorities from my uploaded references"
            multiline
            style={styles.input}
          />
          <Pressable
            style={[styles.primaryButton, !canAsk && styles.disabledButton]}
            disabled={!canAsk || isAsking}
            onPress={askQuestion}
          >
            <Text style={styles.primaryButtonText}>Get answer</Text>
          </Pressable>
          <Text style={styles.smallPrint}>
            The app blocks diagnosis, treatment plans, medication dosing, and emergency decision-making.
          </Text>
        </View>

        {isAsking ? <ActivityIndicator size="large" color="#345B63" /> : null}

        {result ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Short answer</Text>
            <Text style={styles.answer}>{result.shortAnswer}</Text>

            <Text style={styles.sectionTitle}>Supporting excerpts</Text>
            {result.sources.map((source, index) => (
              <View key={`${source.filename}-${index}`} style={styles.sourceCard}>
                <Text style={styles.sourceFile}>{source.filename}</Text>
                <Text style={styles.sourceExcerpt}>{source.excerpt}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Files used</Text>
            <Text style={styles.fileList}>{result.usedFilenames.join(", ") || "No filenames returned."}</Text>

            <Pressable style={styles.secondaryButton} onPress={exportResult}>
              <Text style={styles.secondaryButtonText}>Export to notes/plain text</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F8FA" },
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 30, fontWeight: "700", color: "#23313A" },
  subtitle: { fontSize: 16, color: "#51616B" },
  banner: {
    backgroundColor: "#FFF6E8",
    borderColor: "#E8A150",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  bannerText: { color: "#653900", fontSize: 15, fontWeight: "600" },
  bannerReminder: { color: "#8D5524", fontSize: 14 },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#23313A" },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#345B63",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#345B63",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#345B63", fontSize: 16, fontWeight: "600" },
  emptyState: {
    backgroundColor: "#EAF2F5",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#B6CDD6",
    gap: 6,
  },
  emptyStateTitle: { fontSize: 20, fontWeight: "700", color: "#2E4A53" },
  emptyStateText: { fontSize: 15, color: "#3C5A63", lineHeight: 22 },
  docCard: {
    borderWidth: 1,
    borderColor: "#C7D6DC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#FAFCFD",
  },
  docCardSelected: { borderColor: "#345B63", backgroundColor: "#E7EFF2" },
  docFilename: { fontSize: 15, fontWeight: "600", color: "#28343B" },
  docMeta: { fontSize: 13, color: "#60717A", marginTop: 2 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#B6CAD1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F7FAFB",
  },
  presetChipSelected: { backgroundColor: "#345B63", borderColor: "#345B63" },
  presetChipText: { color: "#3F5963", fontSize: 14, fontWeight: "500" },
  presetChipTextSelected: { color: "#FFFFFF" },
  input: {
    minHeight: 110,
    borderRadius: 12,
    borderColor: "#C1D2D9",
    borderWidth: 1,
    padding: 12,
    backgroundColor: "#FCFEFF",
    fontSize: 16,
    textAlignVertical: "top",
  },
  smallPrint: { fontSize: 12, color: "#6A7A83" },
  answer: { fontSize: 16, lineHeight: 24, color: "#2A3840" },
  sourceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D5E0E4",
    backgroundColor: "#FBFDFE",
    padding: 10,
    gap: 4,
  },
  sourceFile: { fontSize: 14, fontWeight: "700", color: "#29424A" },
  sourceExcerpt: { fontSize: 14, color: "#455A62", lineHeight: 20 },
  fileList: { fontSize: 14, color: "#3C5058" },
});
