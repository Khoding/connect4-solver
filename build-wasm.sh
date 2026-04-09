#!/usr/bin/env bash
# Build the Connect 4 solver WASM module.
# Requires Emscripten (emcc) in PATH.
#
# Usage: bash build-wasm.sh
# On Windows with PowerShell, use: pwsh -c "./build-wasm.sh" or run the emcc command directly.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CPP_DIR="$SCRIPT_DIR/src/solver/cpp"
OUT_DIR="$SCRIPT_DIR/public/wasm"

mkdir -p "$OUT_DIR"

echo "Building Connect 4 WASM solver..."

emcc \
  "$CPP_DIR/bridge.cpp" \
  "$CPP_DIR/Solver.cpp" \
  -I "$CPP_DIR" \
  --std=c++11 \
  -O3 \
  -DNDEBUG \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_analyze","_solve","_load_book","_get_node_count","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","FS"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=134217728 \
  -s MAXIMUM_MEMORY=536870912 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createC4Solver" \
  -s ENVIRONMENT=web \
  -s FILESYSTEM=1 \
  -o "$OUT_DIR/c4solver.js"

echo "Done! Output:"
echo "  $OUT_DIR/c4solver.js"
echo "  $OUT_DIR/c4solver.wasm"
