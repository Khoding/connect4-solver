#!/usr/bin/env bash
# Build the Connect 4 solver WASM module.
# Requires Emscripten (emcc) in PATH.
#
# Usage: bash build-wasm.sh
# On Windows with PowerShell, use: pwsh -c "./build-wasm.sh" or run the emcc command directly.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CPP_DIR="$SCRIPT_DIR/app/solver/cpp"
OUT_DIR="$SCRIPT_DIR/public/wasm"

mkdir -p "$OUT_DIR"

# Flags shared by both targets.
COMMON=(
  "$CPP_DIR/bridge.cpp"
  "$CPP_DIR/Solver.cpp"
  -I "$CPP_DIR"
  --std=c++11
  -O3
  -DNDEBUG
  -s WASM=1
  -s EXPORTED_FUNCTIONS='["_analyze","_solve","_load_book","_get_node_count","_malloc","_free"]'
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","FS"]'
  -s ALLOW_MEMORY_GROWTH=1
  -s INITIAL_MEMORY=134217728
  -s MAXIMUM_MEMORY=536870912
  -s MODULARIZE=1
  -s FILESYSTEM=1
)

# 1) Browser target — UMD global (createC4Solver), loaded via <script> in
#    app/solver/index.js. This is what ships to users.
echo "Building Connect 4 WASM solver (web)..."
emcc "${COMMON[@]}" \
  -s EXPORT_NAME="createC4Solver" \
  -s ENVIRONMENT=web \
  -o "$OUT_DIR/c4solver.js"

# 2) Node target — ES module (export default) for the Learn-mode oracle harness
#    (scripts/solver-oracle.mjs). Separate artifact because the repo is
#    "type":"module", so a UMD .js can't be required, and EXPORT_ES6 would break
#    the browser's global-script loader. Same C++, different JS wrapper.
echo "Building Connect 4 WASM solver (node)..."
emcc "${COMMON[@]}" \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT=node \
  -o "$OUT_DIR/c4solver.node.mjs"

echo "Done! Output:"
echo "  $OUT_DIR/c4solver.js        (browser)"
echo "  $OUT_DIR/c4solver.wasm"
echo "  $OUT_DIR/c4solver.node.mjs  (node oracle)"
echo "  $OUT_DIR/c4solver.node.wasm"
