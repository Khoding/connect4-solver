/*
 * Copyright (C) 2026 Khodok — AGPL-3.0.
 *
 * Cross-platform launcher for `npm run build:wasm`. Picks the OS-native build
 * script: build-wasm.ps1 on Windows (pwsh, falling back to powershell),
 * build-wasm.sh elsewhere. Both emit the same two artifacts.
 *
 * Emscripten must be active in the shell first (emcc on PATH); see the build
 * scripts' headers.
 */

import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function exit(status) {
  process.exit(status ?? 1);
}

if (process.platform === 'win32') {
  const script = join(ROOT, 'build-wasm.ps1');
  for (const shell of ['pwsh', 'powershell']) {
    const r = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
      stdio: 'inherit',
      cwd: ROOT,
    });
    if (r.error?.code === 'ENOENT') continue; // shell not installed, try the next
    exit(r.status);
  }
  console.error('Could not find pwsh or powershell on PATH.');
  exit(1);
} else {
  const r = spawnSync('bash', [join(ROOT, 'build-wasm.sh')], {stdio: 'inherit', cwd: ROOT});
  if (r.error?.code === 'ENOENT') {
    console.error('bash not found on PATH.');
    exit(1);
  }
  exit(r.status);
}
