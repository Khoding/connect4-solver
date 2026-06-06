/*
 * Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
 * Copyright (C) 2026 Khodok — AGPL-3.0 (see app/solver/* headers).
 *
 * Node-side loader for the Connect 4 WASM solver, used by the Learn-mode
 * oracle harness. It reuses the EXACT production artifacts in public/wasm so
 * the oracle validates against the same solver that ships in the browser.
 *
 * Prerequisite: the node-targeted artifact must exist. It is NOT the web glue
 * (the repo is "type":"module", so the UMD c4solver.js can't be required).
 * build-wasm.sh emits a dedicated ES-module build, c4solver.node.mjs. Build it
 * once with: bash build-wasm.sh   (needs the Emscripten SDK / emcc on PATH).
 *
 * Mirrors app/solver/index.js (analyze/solve), minus the browser plumbing
 * (no <script> injection, no fetch, no IndexedDB) — the book is read straight
 * off disk into the Emscripten virtual filesystem.
 */

import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {dirname, join} from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const WASM_DIR = join(HERE, '..', 'public', 'wasm');
const GLUE = join(WASM_DIR, 'c4solver.node.mjs');
const BOOK = join(WASM_DIR, '7x6.book');

let modPromise = null;

function rebuildHint(detail) {
  return (
    'The node-targeted WASM solver (c4solver.node.mjs) is not available.\n' +
    '  1. Install the Emscripten SDK (emcc on PATH)\n' +
    '  2. Run: bash build-wasm.sh   (emits c4solver.node.mjs alongside the web build)\n' +
    `Detail: ${detail}`
  );
}

async function loadModule() {
  if (modPromise) return modPromise;
  modPromise = (async () => {
    if (!existsSync(GLUE)) throw new Error(rebuildHint(`missing ${GLUE}`));

    let createC4Solver;
    try {
      ({default: createC4Solver} = await import(pathToFileURL(GLUE).href));
    } catch (e) {
      throw new Error(rebuildHint(`import() failed: ${e.message}`));
    }

    let mod;
    try {
      mod = await createC4Solver({locateFile: p => join(WASM_DIR, p)});
    } catch (e) {
      throw new Error(rebuildHint(`module init failed: ${e.message}`));
    }

    // Opening book — makes shallow positions instant, which is what keeps the
    // oracle budget affordable (the near-empty board is the slowest to solve).
    // Set C4_ORACLE_BOOK=0 to skip it (slower, but no 33 MB dependency).
    let bookLoaded = false;
    if (process.env.C4_ORACLE_BOOK !== '0' && existsSync(BOOK)) {
      const data = new Uint8Array(readFileSync(BOOK));
      mod.FS.writeFile('/7x6.book', data);
      mod.ccall('load_book', 'number', ['string'], ['/7x6.book']);
      bookLoaded = true;
    }

    return {mod, bookLoaded};
  })();
  return modPromise;
}

/**
 * Strong-analyze a position: score for every column from the mover's view.
 * @param {string} moves - digits 1-7
 * @returns {Promise<number[]>} 7 scores (>0 win, <0 loss, 0 draw, -1000 unplayable)
 */
export async function analyze(moves) {
  const {mod} = await loadModule();
  const ptr = mod.ccall('analyze', 'number', ['string'], [moves]);
  const scores = [];
  for (let i = 0; i < 7; i++) scores.push(mod.getValue(ptr + i * 4, 'i32'));
  return scores;
}

/**
 * Solve a single position for the mover.
 * @param {string} moves - digits 1-7
 * @param {boolean} weak - win/draw/loss only (faster) vs exact distance
 * @returns {Promise<number>} score, or -1000 on invalid input
 */
export async function solve(moves, weak = false) {
  const {mod} = await loadModule();
  return mod.ccall('solve', 'number', ['string', 'number'], [moves, weak ? 1 : 0]);
}

/** Whether the opening book was mounted (diagnostics). */
export async function oracleInfo() {
  const {bookLoaded} = await loadModule();
  return {bookLoaded};
}
