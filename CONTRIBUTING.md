# Contributing

Thanks for helping improve Pi Coding Agent for Raycast.

## Local setup

```bash
npm install
npm run dev
```

## Validation

Before opening a PR, run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Safety expectations

- Hidden Raycast commands must not get write/bash/edit access by default.
- Workflows that can mutate a repository should hand off to visible Pi in a terminal.
- Session parsing must tolerate malformed lines and very large JSONL files.
