#!/usr/bin/env pwsh
# Build the Connect 4 solver WASM module (PowerShell-native mirror of build-wasm.sh).
#
# Requires the Emscripten SDK active in THIS session first:
#   & C:\Users\Julien\emsdk\emsdk_env.ps1
# Then run either:
#   npm run build:wasm
#   pwsh -NoProfile -File build-wasm.ps1
#
# Emits two artifacts from the same C++: a browser UMD build (createC4Solver
# global, loaded via <script> in app/solver/index.js) and a node ES-module
# build (c4solver.node.mjs) for the Learn-mode oracle harness. See build-wasm.sh
# for the rationale behind two artifacts.

$ErrorActionPreference = 'Stop'

$Root = $PSScriptRoot
$CppDir = Join-Path $Root 'app/solver/cpp'
$OutDir = Join-Path $Root 'public/wasm'

if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
  Write-Error 'emcc not found on PATH. Activate Emscripten first:  & C:\Users\Julien\emsdk\emsdk_env.ps1'
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Flags shared by both targets. Array settings use the comma-list form (not the
# JSON ["..."] form) so embedded quotes survive PowerShell -> emcc.bat.
$Common = @(
  (Join-Path $CppDir 'bridge.cpp')
  (Join-Path $CppDir 'Solver.cpp')
  '-I', $CppDir
  '--std=c++11'
  '-O3'
  '-DNDEBUG'
  '-s', 'WASM=1'
  '-s', 'EXPORTED_FUNCTIONS=_analyze,_solve,_load_book,_get_node_count,_malloc,_free'
  '-s', 'EXPORTED_RUNTIME_METHODS=ccall,cwrap,getValue,FS'
  '-s', 'ALLOW_MEMORY_GROWTH=1'
  '-s', 'INITIAL_MEMORY=134217728'
  '-s', 'MAXIMUM_MEMORY=536870912'
  '-s', 'MODULARIZE=1'
  '-s', 'FILESYSTEM=1'
)

Write-Host 'Building Connect 4 WASM solver (web)...'
emcc @Common -s EXPORT_NAME=createC4Solver -s ENVIRONMENT=web -o (Join-Path $OutDir 'c4solver.js')

Write-Host 'Building Connect 4 WASM solver (node)...'
emcc @Common -s EXPORT_ES6=1 -s ENVIRONMENT=node -o (Join-Path $OutDir 'c4solver.node.mjs')

Write-Host 'Done! Output:'
Write-Host "  $OutDir\c4solver.js        (browser)"
Write-Host "  $OutDir\c4solver.wasm"
Write-Host "  $OutDir\c4solver.node.mjs  (node oracle)"
Write-Host "  $OutDir\c4solver.node.wasm"
