# Raycast Pi implementation plan

## Source material used

- Raycast extension basics: create/build flow uses `npm install`, `npm run dev`, and Raycast commands.
- Raycast manifest docs: command entries, preferences, icons, categories, command modes.
- Raycast List and Detail docs: searchable list UIs, markdown previews, action panels.
- Raycast process execution docs: external process execution patterns; this project uses Node `spawn` for streaming Pi output and AppleScript/CLI launchers for terminal handoff.
- Raycast AI Extension docs: tools are functions with object inputs, JSDoc descriptions, optional confirmations and evals. This project intentionally defers AI Extension tools until the core companion is stable.
- Pi docs: CLI supports interactive launch, `-p`, `-c`, `--session`, `--fork`, `--mode rpc`; sessions live under `~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl`.
- Comparable implementations: ClaudeCast and OpenCode for Raycast both validate the product shape: quick ask, project/session search, and terminal handoff.

## Invariant

Raycast should be a fast command palette and read-only quick-action layer for Pi; any workflow that can mutate a repo or run shell commands should hand off to Pi in a visible terminal.

## Assumptions answered without blocking

- Extension name: `Raycast Pi`, package name `raycast-pi`.
- MVP favors CLI/terminal handoff over RPC UI because it is simpler, robust, and aligned with Pi's terminal-native philosophy.
- Quick Ask and Transform Selection use `pi -p` because they are explicit, short-lived user actions.
- Session/project discovery reads Pi JSONL files directly; it must tolerate custom entries and malformed lines.
- Raycast AI Extension tools are out of scope for the first build because exposing write/delete tools through Raycast AI needs extra policy and eval work.

## Feature plan and success criteria

### 1. Launch Pi in Project

Build a searchable project picker from Pi session history, with actions to start a new Pi terminal session, continue the latest session, open the folder, and copy the path.

Success criteria:

- Projects are derived from parsed Pi session headers and sorted by most recent session.
- Each project item shows path, session count, latest activity, and latest model when known.
- New session launches `pi` in the selected cwd in the configured terminal.
- Continue launches `pi --session <latest-session-file>` in the project cwd.
- Unit tests cover project grouping and latest session selection.

### 2. Browse Pi Sessions

Build a searchable session browser with markdown preview and actions to resume, fork, copy path, and open project.

Success criteria:

- Reads sessions from `~/.pi/agent/sessions` or custom preference.
- Parses `session`, `model_change`, `thinking_level_change`, `session_info`, and `message` entries.
- Extracts first user prompt, last assistant text, turn count, model/provider, cost when available, and preview text.
- Handles malformed/non-JSON lines without crashing.
- Unit tests cover parsing user/assistant content arrays and malformed lines.

### 3. Quick Ask Pi

Build a Raycast form/detail command that runs `pi -p` in a selected/default project and streams/captures the answer.

Success criteria:

- User can submit a prompt and optional project cwd.
- Command uses configured Pi binary and optional model/thinking preferences.
- Output is visible in Raycast and can be copied.
- User can hand off the same prompt to interactive Pi in terminal.
- Unit tests cover CLI argument construction.

### 4. Transform Selection

Build selected-text transforms: explain, find bugs, write tests, refactor, convert to TypeScript, improve writing.

Success criteria:

- Reads selected text or falls back to clipboard.
- Runs `pi -p` with selected text and chosen transform prompt.
- Shows result in Raycast with copy/paste actions.
- Does not write files directly.
- Unit tests cover transform prompt construction.

### 5. Git Actions

Build git-aware actions that hand off visible Pi terminal sessions for diff review, commit messages, PR descriptions, and failing test investigation.

Success criteria:

- Uses selected project cwd.
- Launches terminal with prompts that instruct Pi to inspect local git state itself.
- Avoids hidden background mutation.
- Actions are visible and discoverable from Raycast.

### 6. Prompt/Skill Browser

List global and project Pi prompt templates and skills with actions to open/copy paths and launch Pi with a selected skill/prompt context.

Success criteria:

- Discovers `~/.pi/agent/prompts`, `~/.pi/agent/skills`, and project-local `.pi`/`.agents` resources where present.
- Displays type, scope, and file path.
- Opens resources in the default app and copies paths.
- Unit tests cover resource discovery path classification with mocked file entries where practical.

### 7. Menu Bar Status

Show lightweight recent Pi activity.

Success criteria:

- Displays recent session count and most recent project.
- Menu actions open project picker and session browser.
- Does not perform heavy indexing on every refresh.

## Test strategy

- Pure TypeScript unit tests with Vitest for parsing, grouping, command argument construction, and transform prompts.
- Raycast static validation with `npm run lint` and `npm run build`.
- Manual smoke test path: `npm run dev`, open each Raycast command, verify actions construct expected terminal/CLI calls.
- Review loop: run tests/build locally, then run a reviewer pass over the diff before finalizing.

## Iteration order

1. Scaffold Raycast extension, docs, tests.
2. Red/green parser tests for Pi sessions.
3. Red/green CLI and transform prompt tests.
4. Build Raycast commands over tested libraries.
5. Run `npm test`, `npm run lint`, `npm run build`.
6. Reviewer pass; fix findings; rerun validation.
