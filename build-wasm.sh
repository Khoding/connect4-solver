#!/usr/bin/env bash
# Build the Connect 4 solver WASM module for a single board size.
# Requires Emscripten (emcc) in PATH.
#
# Usage: bash build-wasm.sh [WIDTH] [HEIGHT]
#   Defaults to the classic 7x6 board when no arguments are given.
#   Example: bash build-wasm.sh 10 7
#
# Output (into public/wasm/):
#   c4solver-{WIDTH}x{HEIGHT}.js    — Emscripten glue
#   c4solver-{WIDTH}x{HEIGHT}.wasm  — binary
#
# Only the 7x6 board ships an opening book (public/wasm/7x6.book); the other
# sizes simply run without one (correct, just slower on deep positions).
#
# On Windows with PowerShell, run via: pwsh -c "bash ./build-wasm.sh 10 7"

set -e

W="${1:-7}"
H="${2:-6}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CPP_DIR="$SCRIPT_DIR/src/solver/cpp"
OUT_DIR="$SCRIPT_DIR/public/wasm"

mkdir -p "$OUT_DIR"

echo "Building Connect 4 WASM solver (${W}x${H})..."

emcc \
  "$CPP_DIR/bridge.cpp" \
  "$CPP_DIR/Solver.cpp" \
  -I "$CPP_DIR" \
  --std=c++11 \
  -O3 \
  -DNDEBUG \
  -DWIDTH=$W \
  -DHEIGHT=$H \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_analyze","_solve","_load_book","_get_node_count","_set_max_nodes","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","getValue","FS"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=134217728 \
  -s MAXIMUM_MEMORY=536870912 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createC4Solver" \
  -s ENVIRONMENT=web \
  -s FILESYSTEM=1 \
  -o "$OUT_DIR/c4solver-${W}x${H}.js"

echo "Done! Output:"
echo "  $OUT_DIR/c4solver-${W}x${H}.js"
echo "  $OUT_DIR/c4solver-${W}x${H}.wasm"
