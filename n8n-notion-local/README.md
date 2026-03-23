# Self-hosted n8n + Notion (macOS, beginner-friendly)

This folder provides a simple local Docker Compose setup for running n8n and connecting it to Notion.

## What this includes

- `docker-compose.yml`: Runs n8n on `http://localhost:5678`
- `.env.example`: Safe template of required environment variables
- Persistent volume: `n8n_data` keeps workflows/credentials across restarts

## 1) Prerequisites

1. Install **Docker Desktop for Mac**.
2. Start Docker Desktop and wait until it shows **Running**.
3. Open Terminal and move into this folder.

```bash
cd /path/to/n8n-notion-local
```

## 2) Create your `.env`

```bash
cp .env.example .env
```

Open `.env` and confirm or update values:

- Keep local URL values at localhost unless you know you need something else:
  - `N8N_HOST=localhost`
  - `N8N_EDITOR_BASE_URL=http://localhost:5678`
  - `WEBHOOK_URL=http://localhost:5678/`
- Set `N8N_ENCRYPTION_KEY` to a strong random value (important for encrypted credentials persistence):

```bash
openssl rand -base64 32
```

Paste the generated value into `N8N_ENCRYPTION_KEY=...`.

## 3) Start n8n

```bash
docker compose up -d
```

Open n8n at:

- `http://localhost:5678`

On first launch, create the owner account in the n8n UI.

## 4) Connect Notion

### A. Create a Notion integration

1. Go to <https://www.notion.so/my-integrations>
2. Click **New integration** and save it.
3. Copy the **Internal Integration Secret**.
4. Open your target Notion database and click **Share**.
5. Invite the integration you created.
6. Copy the database ID from the Notion database URL.

### B. Add credentials in n8n

1. In n8n: **Credentials** → **Add credential** → **Notion API**.
2. Paste the Notion Internal Integration Secret.
3. Save.

### C. Build a quick smoke test workflow

1. **Workflows** → **New Workflow**.
2. Add **Manual Trigger**.
3. Add a **Notion** node.
4. Configure the Notion node to create a page in your target database.
5. Execute the workflow and verify a new row/page appears in Notion.

## 5) Common operations

Start:

```bash
docker compose up -d
```

Stop:

```bash
docker compose down
```

Follow logs:

```bash
docker compose logs -f n8n
```

Update to a newer n8n image:

```bash
docker compose pull
docker compose up -d
```

## 6) Backup and restore notes

n8n data is stored in Docker volume `n8n_data`.

Inspect volume:

```bash
docker volume inspect n8n_data
```

If you move machines, include a backup/restore plan for this volume so your workflows and credentials are preserved.

## 7) Security notes

- Do **not** commit `.env` with real secrets.
- Keep `N8N_SECURE_COOKIE=false` only for local HTTP usage.
- If exposing n8n beyond localhost, put it behind HTTPS + reverse proxy first.

## 8) Troubleshooting

### Port 5678 already in use

Stop the process using port `5678` or change the host-side port mapping in `docker-compose.yml`.

### n8n starts but Notion calls fail

- Re-check that the integration is invited to the database in Notion.
- Confirm the token was copied correctly in n8n credentials.
- Confirm the database ID is correct.
