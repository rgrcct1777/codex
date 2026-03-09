# Nurse Reference Assistant (iPhone-first)

A focused **React Native + Expo iPhone app** and secure backend for asking questions about your own nursing study/reference PDFs.

> For education and reference only. Verify against current policy, physician orders, and your clinical judgment.

## Open this file first
Open **`nurse-reference-assistant/README.md`** first (this file), then open **`nurse-reference-assistant/mobile/App.tsx`** to start with the main iPhone app screen.

## What this v1 does
- Upload PDF files
- View uploaded documents
- Ask questions about uploaded PDFs
- Show a short answer first
- Show supporting source excerpts
- Show filenames used
- Preset actions:
  - Make study guide
  - Create patient education handout
  - Compare 2 documents
  - Quiz me
  - Shift cheat sheet
- Export answer + excerpts to notes/plain text (iOS Share Sheet)

## Safety guardrails in v1
- Visible in-app safety banner
- Reminder not to upload real patient data (no PHI)
- Backend prompt guardrails to decline diagnosis, treatment plans, medication dosing, and emergency decision-making

## Tech stack
- **Mobile app:** React Native + Expo + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **AI:** OpenAI Responses API + `file_search` retrieval

## Beginner-friendly setup (exact steps)

### 1) Prerequisites
Install these first:
- Node.js 20+
- npm
- Expo Go app on your iPhone

### 2) Create environment file
From repo root:

```bash
cd nurse-reference-assistant
cp .env.example .env
```

Edit `.env` and add your real `OPENAI_API_KEY`.

For iPhone + Expo Go, also set `EXPO_PUBLIC_API_BASE_URL` to your computer's LAN address (example: `http://192.168.1.10:4000`). `localhost` only works on the same device, so it will fail from a phone.

### 3) Start backend
In terminal A:

```bash
cd nurse-reference-assistant/backend
npm install
cp ../.env .env
npm run dev
```

Backend runs on `http://localhost:4000` by default.

### 4) Start mobile app
In terminal B:

```bash
cd nurse-reference-assistant/mobile
npm install
cp ../.env .env
npm run start
```

Then:
- Press `i` for iOS simulator, **or**
- Scan QR code with Expo Go on iPhone.

### 5) First-run flow
1. Tap **Upload PDF**
2. Pick a nursing study/reference PDF
3. Optionally choose a preset action
4. Ask a question
5. Export the answer if needed

## Project structure (plain English)

```text
nurse-reference-assistant/
  mobile/                # iPhone app UI and user workflow
    App.tsx              # Main screen (upload, presets, Q&A, export)
  backend/               # Secure server (holds API key)
    src/server.ts        # API routes for upload, list, ask
    src/openaiService.ts # OpenAI Responses + file_search logic
    src/store.ts         # Simple local JSON document store for v1
  AGENTS.md              # Stable project rules for future Codex runs
  PLANS.md               # Large-change planning checklist
  .codex/config.json     # Shared Codex project configuration
  .env.example           # Environment variable template
```

## Notes for future integrations
The current API design is intentionally simple and modular so you can later add:
- Notes integrations
- Reminder systems
- Calendar-based study planning
- Additional export pipelines
