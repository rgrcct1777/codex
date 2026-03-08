# Nurse Reference Assistant Agent Rules

Scope: entire `nurse-reference-assistant/` folder.

## Product intent
- Build and maintain this as an iPhone-first **study/reference** assistant.
- Keep the experience calm, polished, and practical for a busy nurse.
- Use plain English labels and beginner-friendly explanations.

## Safety and privacy rules
- This app is for education/reference only.
- Never implement diagnosis, treatment planning, medication dosing, or emergency decision-making support.
- Never store or expose API keys in the mobile app.
- Keep API keys server-side only.
- Do not support uploading real patient data (no PHI).

## Development behavior
- Prefer minimal safe changes.
- Comment important files and non-obvious logic.
- Keep UI iPhone-first with large tap targets and uncluttered layout.
- Keep architecture ready for future integrations.
- When making larger changes, create/update `PLANS.md` first.
