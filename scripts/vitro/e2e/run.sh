#!/bin/bash
# Zot Vitro: a save from end to end, in Chromium with the built extension (the MV3 build has
# the same common code as Firefox's): translators from repo.zotero.org, a test page with an
# article and its PDF, ZotFlow's real connector server with its web API faked (it logs what
# it would write to zotflow.log). Needs xvfb-run, Playwright, and ZotFlow Evo's source.
# Usage: scripts/vitro/e2e/run.sh /path/to/zotflow-evo
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$DIR"/../../.. && pwd )"
ZOTFLOW="${1:?path to zotflow-evo}"
(cd "$ZOTFLOW" && npx esbuild "$DIR/fake-zotflow.ts" --bundle --platform=node \
	--tsconfig="$ZOTFLOW/tsconfig.json" --outfile="$DIR/fake-zotflow.js" --log-level=warning)
rm -rf "${TMPDIR:-/tmp}/zot-vitro-e2e-profile"
node "$DIR/fake-zotflow.js" > "$DIR/zotflow.log" 2>&1 & ZF=$!
node "$DIR/site.js" > /dev/null 2>&1 & SITE=$!
trap 'kill $ZF $SITE 2>/dev/null' EXIT
sleep 1
xvfb-run -a node "$DIR/run.js" "$ROOT_DIR/build/manifestv3"
echo "What ZotFlow was asked to write: $DIR/zotflow.log"
