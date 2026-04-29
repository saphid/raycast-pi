# Raycast Pi

Raycast companion extension for the Pi coding agent.

## Project scope

- Build a Raycast extension that makes Pi easier to launch, query, and resume from macOS/Windows Raycast.
- Keep risky code-editing and shell-executing agent work observable by handing off to a real terminal unless the command is explicitly a read-only `pi -p` quick ask/transform.
- Prefer small, testable pure TypeScript modules for Pi session parsing, project discovery, and CLI command construction.

## Design flow reminder

For non-trivial work, use the design discipline flow: `grill-me` → `ubiquitous-language` → `domain-model` → `design-an-interface`/`improve-codebase-architecture` → `to-prd` → `tdd`. If the user explicitly asks not to be questioned, answer uncertainties with documented assumptions and continue.

## Validation

After TypeScript changes, run:

```bash
npm test
npm run lint
npm run build
```

If Raycast CLI environment issues block `lint` or `build`, classify the failure before retrying and keep `npm test` green.

## Release target

GitHub remote should be created under `SAPHID` using the NurseDroid `gh` CLI, per project request.
