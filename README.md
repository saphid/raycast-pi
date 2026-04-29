# Raycast Pi

Raycast companion for the [Pi coding agent](https://pi.dev): quick ask, session search, project launch, selected-text transforms, Git workflow prompts, prompt/skill browsing, and menu-bar activity.

## What it does

- **Ask Pi** — run a read-only `pi -p` prompt from Raycast and copy the answer or continue in a real terminal.
- **Launch Project** — discover projects from Pi session history and launch/continue Pi in your configured terminal.
- **Browse Sessions** — search, preview, resume, and fork Pi JSONL sessions.
- **Transform Selection** — explain, find bugs, write tests, refactor, convert to TypeScript, or improve text using selected text/clipboard.
- **Git Actions** — launch visible Pi terminal workflows for staged/unstaged review, commit messages, PR descriptions, and test failure investigation.
- **Browse Pi Resources** — inspect global/project Pi prompt templates and skills.
- **Pi Status** — menu-bar shortcut to recent Pi activity.

## Safety model

Raycast is the command palette. Pi remains the observable execution environment.

- Quick Ask and Transform Selection use `pi -p` for explicit, short-lived read-only tasks.
- Repo-mutating and shell-capable workflows launch Pi in a visible terminal.
- Session and project discovery reads local Pi JSONL files only.

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
- **Default Project** — cwd for quick ask/transform.
- **Default Model** / **Thinking Level** — optional Pi CLI overrides.
- **Terminal Application** — Terminal.app, iTerm, Ghostty, Warp, Kitty, Alacritty, or default.

## Publishing note

Raycast's lint requires `package.json.author` to be an existing Raycast Store username. The GitHub repo is intended to live under `SAPHID`; before a Store submission, replace the manifest author with the actual Raycast account that will publish the extension.
