# Configuration

For basic configuration instructions, see [this documentation](https://developers.openai.com/codex/config-basic).

For advanced configuration instructions, see [this documentation](https://developers.openai.com/codex/config-advanced).

For a full configuration reference, see [this documentation](https://developers.openai.com/codex/config-reference).

## Connecting to MCP servers

Codex can connect to MCP servers configured in `~/.codex/config.toml`. See the configuration reference for the latest MCP server options:

- https://developers.openai.com/codex/config-reference

## Apps (Connectors)

Use `$` in the composer to insert a ChatGPT connector; the popover lists accessible
apps. The `/apps` command lists available and installed apps. Connected apps appear first
and are labeled as connected; others are marked as can be installed.

## Notify

Codex can run a notification hook when the agent finishes a turn. See the configuration reference for the latest notification settings:

- https://developers.openai.com/codex/config-reference

## JSON Schema

The generated JSON Schema for `config.toml` lives at `codex-rs/core/config.schema.json`.

## Notices

Codex stores "do not show again" flags for some UI prompts under the `[notice]` table.

## Plan mode defaults

`plan_mode_reasoning_effort` lets you set a Plan-mode-specific default reasoning
effort override. When unset, Plan mode uses the built-in Plan preset default
(currently `medium`). When explicitly set (including `none`), it overrides the
Plan preset. The string value `none` means "no reasoning" (an explicit Plan
override), not "inherit the global default". There is currently no separate
config value for "follow the global default in Plan mode".

Ctrl+C/Ctrl+D quitting uses a ~1 second double-press hint (`ctrl + c again to quit`).

## Use Ollama as your local model provider

If you want Codex to use your local Ollama server instead of cloud-hosted models:

1. Start Ollama locally:

   ```bash
   ollama serve
   ```

2. In `~/.codex/config.toml`, set Ollama as the default OSS provider:

   ```toml
   oss_provider = "ollama"
   ```

3. Run Codex in local mode:

   ```bash
   codex --oss
   ```

You can also choose the provider per run:

```bash
codex --oss --local-provider ollama
```

If your Ollama server is not on the default URL (`http://localhost:11434/v1`), override the built-in provider in your config:

```toml
[model_providers.ollama]
name = "Ollama"
base_url = "http://your-host:11434/v1"
wire_api = "responses"
```
