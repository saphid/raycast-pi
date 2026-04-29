# Raycast Store submission notes

## Ready

- Extension builds with `ray build`.
- Extension passes `ray lint` with the current placeholder-valid author.
- Commands have user-facing descriptions and safe defaults.
- Icon is a 512×512 PNG.
- README documents prerequisites, preferences, safety model, and validation.
- Repo can be made public for review/distribution.

## Remaining external blocker

Raycast validates `package.json.author` against Raycast Store usernames, not GitHub usernames. `SAPHID` / `saphid` is currently not a Raycast Store user, so the manifest uses a placeholder-valid author only to keep local lint/build working.

Before submitting to the Store:

1. Create or identify the real Raycast account that should own the extension.
2. Replace `package.json.author` with that Raycast username.
3. Re-run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Submission path

Preferred Store path:

1. Fork https://github.com/raycast/extensions with the publishing account.
2. Copy this repo into `extensions/pi-coding-agent`.
3. Verify manifest:
   - `name`: `pi-coding-agent`
   - `title`: `Pi Coding Agent`
   - `author`: real Raycast username
   - `categories`: Developer Tools, Productivity
4. Add screenshots/metadata if requested by Raycast review.
5. Open a PR to `raycast/extensions`.

Alternative path:

- Use `npm run publish` once the Raycast author is real and authenticated locally.

## Suggested screenshots

- Ask Pi response view.
- Browse Sessions with preview.
- Launch Project list.
- Transform Selection list/result.
- Preferences showing Ask execution mode and max indexed sessions.
