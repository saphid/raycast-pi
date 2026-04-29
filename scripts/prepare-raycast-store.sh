#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/raycast/extensions [raycast-author]" >&2
  exit 1
fi

RAYCAST_EXTENSIONS_ROOT="$1"
RAYCAST_AUTHOR="${2:-}"
TARGET="$RAYCAST_EXTENSIONS_ROOT/extensions/pi-coding-agent"
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -d "$RAYCAST_EXTENSIONS_ROOT/extensions" ]]; then
  echo "Expected a raycast/extensions checkout with an extensions/ directory: $RAYCAST_EXTENSIONS_ROOT" >&2
  exit 1
fi

rm -rf "$TARGET"
mkdir -p "$TARGET"
rsync -a \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude output \
  --exclude .raycast \
  "$SOURCE_ROOT/" "$TARGET/"

if [[ -n "$RAYCAST_AUTHOR" ]]; then
  node - "$TARGET/package.json" "$RAYCAST_AUTHOR" <<'NODE'
const fs = require("fs");
const [packagePath, author] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8"));
manifest.author = author;
fs.writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
NODE
fi

cat <<MSG
Prepared Raycast Store extension at:
$TARGET

Next steps:
  cd $TARGET
  npm install
  npm run typecheck
  npm test
  npm run lint
  npm run build

Then open a PR to raycast/extensions.
MSG
