# Self-hosted n8n + Notion (macOS, beginner friendly)

This project runs n8n locally with Docker Compose and stores your n8n data in a persistent Docker volume.

## 0) Put this folder on your Mac first

Your error happened because `~/Desktop/n8n-notion-local` does not exist yet.

Pick one path:

### Option A (recommended): copy this folder from Cursor project to your Desktop

In Cursor terminal, run:

```bash
cd /path/to/your/project
cp -R n8n-notion-local ~/Desktop/n8n-notion-local
```

### Option B: create the folder manually and add the three files

```bash
cd ~/Desktop
mkdir -p n8n-notion-local
cd ~/Desktop/n8n-notion-local
```

Then create:
- `docker-compose.yml`
- `.env.example`
- `README.md`

(Use the file contents in this project.)

## 1) Prerequisites (Mac)

1. Install **Docker Desktop for Mac** and open it.
2. Wait until Docker Desktop shows it is running.
3. Open the **Terminal** app.

## 2) Verify files exist

```bash
cd ~/Desktop/n8n-notion-local
ls -la
```

You should see at least:
- `docker-compose.yml`
- `.env.example`

## 3) Configure environment file

```bash
cd ~/Desktop/n8n-notion-local
cp .env.example .env
```

Now open `.env` and replace placeholder values:

- `N8N_HOST=replace_me` → set `localhost`
- `N8N_EDITOR_BASE_URL=replace_me` → set `http://localhost:5678`
- `WEBHOOK_URL=replace_me` → set `http://localhost:5678/`
- `NOTION_API_KEY=replace_me` (keep placeholder in repo files; paste real key in n8n Credentials UI)
- `NOTION_DATABASE_ID=replace_me` (keep placeholder in repo files; paste real value in Notion node)

## 4) Start n8n

```bash
cd ~/Desktop/n8n-notion-local
docker compose up -d
```

Open n8n:

- `http://localhost:5678`

On first launch, create your owner account in n8n.

## 5) Stop / restart / update

Stop:

```bash
cd ~/Desktop/n8n-notion-local
docker compose down
```

Restart:

```bash
cd ~/Desktop/n8n-notion-local
docker compose up -d
```

Upgrade n8n later:

```bash
cd ~/Desktop/n8n-notion-local
docker compose pull
docker compose up -d
```

## 6) Create Notion integration and share database

1. Go to Notion integrations: `https://www.notion.so/my-integrations`
2. Click **New integration**.
3. Name it (example: `n8n-local`), choose your workspace, then save.
4. Copy the **Internal Integration Secret** (this is your Notion API key).
5. Open the target Notion database.
6. Click **Share** → invite your integration (example: `n8n-local`).
7. Copy your database ID from the database URL.

## 7) Build first workflow in n8n (manual trigger → Notion create page)

### A. Add Notion credentials

1. In n8n, click **Credentials**.
2. Click **Add credential**.
3. Choose **Notion API**.
4. In API Key field, paste your real Notion integration secret.
5. Save.

### B. Create workflow

1. Go to **Workflows** → **New Workflow**.
2. Click **Add first step** → choose **Manual Trigger**.
3. Click **+** after Manual Trigger → add **Notion** node.
4. In Notion node:
   - **Credential**: choose the Notion credential you created
   - **Resource**: `Database Page` (or equivalent create-page option in your n8n version)
   - **Operation**: `Create`
   - **Database ID**: paste your `NOTION_DATABASE_ID`
5. Map fields:
   - Title field: `n8n Test Entry`
   - Timestamp/date field: use expression `{{$now}}`
6. Click **Execute workflow**.
7. Confirm a new row/page appears in your Notion database.

## 8) Single-user safety notes

- This setup is intended for one trusted local user.
- Keep `.env` private and do not commit real secrets.
- Use HTTPS + reverse proxy before exposing n8n to the public internet.

## 9) Troubleshooting

Check logs:

```bash
cd ~/Desktop/n8n-notion-local
docker compose logs -f n8n
```

If port 5678 is busy, stop the other app using that port, then rerun:

```bash
cd ~/Desktop/n8n-notion-local
docker compose up -d
```
