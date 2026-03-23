# Self-hosted n8n + Notion (local Docker setup)

This folder provides a beginner-friendly Docker Compose setup for running n8n locally and connecting it to Notion.

## What you get

- `docker-compose.yml` with persistent data volume (`n8n_data`)
- `.env.example` with safe defaults for local development
- `.gitignore` that excludes `.env` to help prevent secret leaks

## 1) Prerequisites (macOS)

1. Install and start **Docker Desktop**.
2. Confirm Docker is running:

```bash
docker version
```

## 2) Configure environment

```bash
cd n8n-notion-local
cp .env.example .env
```

Open `.env` and update values if needed.

Defaults are already set for local use:

- `N8N_HOST=localhost`
- `N8N_PORT=5678`
- `N8N_PROTOCOL=http`
- `N8N_EDITOR_BASE_URL=http://localhost:5678`
- `WEBHOOK_URL=http://localhost:5678/`

## 3) Start n8n

```bash
cd n8n-notion-local
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Open n8n at: <http://localhost:5678>

On first launch, create the owner account.

## 4) Stop / restart / update

Stop:

```bash
docker compose down
```

Restart:

```bash
docker compose up -d
```

Upgrade n8n image:

```bash
docker compose pull
docker compose up -d
```

## 5) Connect Notion

1. Go to <https://www.notion.so/my-integrations>.
2. Create a new integration in your workspace.
3. Copy the **Internal Integration Secret**.
4. Open your Notion database and click **Share**.
5. Invite the integration.
6. Copy the database ID from the Notion database URL.

In n8n:

1. Create a **Notion API** credential and paste the integration secret.
2. Create a workflow with:
   - **Manual Trigger**
   - **Notion** node (Create page in database)
3. Paste your Notion database ID in the Notion node.
4. Execute and confirm a new entry appears in Notion.

## 6) Troubleshooting

View logs:

```bash
docker compose logs -f n8n
```

Validate Compose config:

```bash
docker compose config
```

If port `5678` is busy, either stop the other process or change `N8N_PORT` in `.env`.

## 7) Security notes

- Do **not** commit `.env`.
- Keep real Notion secrets out of git-tracked files.
- This setup is for trusted local use.
- Before exposing publicly, use HTTPS and a reverse proxy.
