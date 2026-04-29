# Pi Coding Agent for Raycast

Raycast companion for the [Pi coding agent](https://pi.dev): quick ask, session search, project launch, selected-text transforms, Git workflow prompts, prompt/skill browsing, and menu-bar activity.

## What it does

- **Ask Pi** — type a question from Raycast root search, then see the streamed `pi -p` response in Raycast.
- **Ask Pi (Copy Answer)** — no-view variant for copy-to-clipboard workflows.
- **Launch Project** — discover projects from Pi session history and launch/continue Pi in your configured terminal.
- **Browse Sessions** — search, preview, resume, and fork Pi JSONL sessions.
- **Transform Selection** — explain, find bugs, write tests, refactor, convert to TypeScript, or improve text using selected text/clipboard.
- **Git Actions** — launch visible Pi terminal workflows for staged/unstaged review, commit messages, PR descriptions, and test failure investigation.
- **Browse Pi Resources** — inspect global/project Pi prompt templates and skills.
- **Pi Status** — menu-bar shortcut to recent Pi activity.

## Safety model

Raycast is the command palette. Pi remains the observable execution environment.

- Ask/Transform use explicit `pi -p` runs and can be configured as **Safe Read-Only Project Tools** or **Fast No Tools**.
- Repo-mutating and shell-capable workflows launch Pi in a visible terminal.
- Session and project discovery reads local Pi JSONL files only.

## Performance model

- Session summaries are cached in Raycast LocalStorage by file path and mtime.
- Project/session lists can index the newest 100, newest 500, or all discovered sessions.
- Menu bar status always uses the newest 100 sessions to stay lightweight.
- Resource discovery scans known Pi folders only and does not read full resource contents.

## Prerequisites

```bash
npm install -g @mariozechner/pi-coding-agent
pi /login
```

Or configure Pi with API keys as documented at https://pi.dev.

## Install for development

```bash
npm install
npm run dev
```

Then open Raycast and search for the Pi commands.

## Validation

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Preferences

- **Pi Binary Path** — optional explicit path to `pi`.
- **Pi Agent Directory** — defaults to `~/.pi/agent`.
- **Default Project** — cwd for Ask Pi and Transform Selection.
- **Default Model** / **Thinking Level** — optional Pi CLI overrides.
- **Ask Pi Execution Mode** — `Safe Read-Only Project Tools` or `Fast No Tools`.
- **Max Indexed Sessions** — newest 100, newest 500, or all.
- **Terminal Application** — Terminal.app, iTerm, Ghostty, Warp, Kitty, Alacritty, or default.

## GitHub Pages

Project page: https://saphid.github.io/raycast-pi/

## Publishing note

Raycast's lint requires `package.json.author` to be an existing Raycast Store username. The GitHub repo lives under `SAPHID`; before a Store submission, replace the manifest author with the actual Raycast account that will publish the extension. Use `scripts/prepare-raycast-store.sh` to copy this repo into a `raycast/extensions` checkout.
