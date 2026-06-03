#!/usr/bin/env bash
# Build the Connect 4 solver WASM module for every supported board preset.
# Requires Emscripten (emcc) in PATH.
#
# Usage: bash build-wasm-all.sh
#
# On Windows with PowerShell, run via: pwsh -c "bash ./build-wasm-all.sh"

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Board presets as "WIDTH HEIGHT" pairs. Keep in sync with the PRESETS map in
# src/stores/game.js. (No 9x6 — that arrives later with the 5-in-a-row work.)
PRESETS=(
  "5 4"
  "6 5"
  "7 6"
  "8 7"
  "9 7"
  "10 7"
  "8 8"
)

for preset in "${PRESETS[@]}"; do
  # shellcheck disable=SC2086 # intentional word-splitting of "W H"
  bash "$SCRIPT_DIR/build-wasm.sh" $preset
done

echo "All ${#PRESETS[@]} board presets built into public/wasm/."
