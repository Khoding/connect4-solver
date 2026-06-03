/*
 * Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
 * Copyright (C) 2026 Khodok
 *
 * This file is part of Connect4 Game Solver.
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * JS wrapper for the Connect 4 WASM solver.
 * Loads the size-specific WASM module, fetches and mounts the opening book
 * (7x6 only), and exposes an async analyze(moves) → scores[WIDTH] interface.
 *
 * Each board preset has its own Emscripten build named
 * `c4solver-{WIDTH}x{HEIGHT}.js` / `.wasm`. Switching sizes unloads the
 * current module before loading the new one.
 *
 * Original solver by Pascal Pons — http://connect4.gamesolver.org
 * Licensed under AGPL-3.0
 */

let modulePromise = null;
let wasmModule = null;
let currentScript = null;

// Bumped on every unload() so an in-flight load that gets superseded by a size
// switch never publishes its (now stale) module.
let loadToken = 0;

// Dimensions of the currently loaded (or pending) module.
let currentWidth = 7;
let currentHeight = 6;

// Keep track of opening book status (only meaningful for the 7x6 build).
let bookLoaded = false;
let bookLoading = false;
let bookError = null;
let bookLoadPromise = null;

/** Only 7x6, 5x4 and 6x5 boards ship an opening book. */
function hasBook(width = currentWidth, height = currentHeight) {
  return (width === 7 && height === 6) || (width === 5 && height === 4) || (width === 6 && height === 5);
}

/** `"{width}x{height}"` size key, used for asset names and cache keys. */
function sizeKey(width = currentWidth, height = currentHeight) {
  return `${width}x${height}`;
}

/**
 * Tear down the currently loaded module so a different size can be loaded.
 * Removes the injected <script>, drops the module reference, and resets the
 * opening-book state.
 */
function unload() {
  loadToken++; // invalidate any in-flight load
  if (currentScript) {
    currentScript.remove();
    currentScript = null;
  }
  wasmModule = null;
  modulePromise = null;
  globalThis.createC4Solver = undefined;

  bookLoaded = false;
  bookLoading = false;
  bookError = null;
  bookLoadPromise = null;
}

/**
 * Initialize the WASM module for the current dimensions. Cached thereafter
 * until unload() is called (e.g. when switching board sizes).
 */
async function initModule() {
  if (wasmModule) return wasmModule;
  if (modulePromise) return modulePromise;

  const width = currentWidth;
  const height = currentHeight;
  const token = loadToken;

  modulePromise = (async () => {
    // Load Emscripten glue code via <script> since it lives in /public
    const script = document.createElement('script');
    await new Promise((resolve, reject) => {
      script.src = `/wasm/c4solver-${sizeKey(width, height)}.js`;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error(`Failed to load WASM glue script for ${sizeKey(width, height)}`));
      document.head.appendChild(script);
    });
    const createC4Solver = globalThis.createC4Solver;
    if (!createC4Solver) throw new Error('createC4Solver not found after loading script');
    const mod = await createC4Solver({
      locateFile: path => `/wasm/${path}`,
    });
    // If a size switch unloaded us mid-flight, don't publish this stale module.
    if (token === loadToken) {
      currentScript = script;
      wasmModule = mod;
    } else {
      script.remove();
    }
    return mod;
  })();

  return modulePromise;
}

/**
 * Fetch the opening book and mount it in the WASM virtual filesystem.
 * The book is cached in IndexedDB so it's only downloaded once.
 * Multiple concurrent callers share the same loading promise.
 */
async function loadOpeningBook() {
  if (!hasBook()) return; // sizes other than 7x6 have no book — nothing to load
  if (bookLoaded) return;
  if (bookLoadPromise) return bookLoadPromise;

  const bookFile = `${sizeKey()}.book`; // e.g. "7x6.book"
  const cacheKey = `book-${sizeKey()}`; // IndexedDB key, scoped per size

  bookLoadPromise = (async () => {
    bookLoading = true;
    bookError = null;

    try {
      const mod = await initModule();

      // Try loading from IndexedDB cache first
      let bookData = await getCachedBook(cacheKey);

      if (!bookData) {
        // Fetch from server (service worker will cache via CacheFirst)
        const response = await fetch(`/wasm/${bookFile}`);
        if (!response.ok) throw new Error(`Failed to fetch opening book: ${response.status}`);
        bookData = new Uint8Array(await response.arrayBuffer());

        // Safety check: if it starts with '<' (60), it is a fallback index.html and not a binary book.
        if (bookData.length > 0 && bookData[0] === 60) {
          throw new Error(`Invalid book binary: fetched HTML instead of book file (404 fallback).`);
        }

        // Cache in IndexedDB as fallback for non-SW environments
        await cacheBook(cacheKey, bookData);
      }

      // Write to Emscripten virtual filesystem
      mod.FS.writeFile(`/${bookFile}`, bookData);

      // Tell the solver to load it
      mod.ccall('load_book', 'number', ['string'], [`/${bookFile}`]);

      bookLoaded = true;
    } catch (e) {
      bookError = e.message;
      bookLoadPromise = null; // allow retry on failure
      console.error('Failed to load opening book:', e);
    } finally {
      bookLoading = false;
    }
  })();

  return bookLoadPromise;
}

// IndexedDB helpers for caching the opening book. Entries are keyed by board
// size (e.g. "book-7x6") so swapping sizes never serves a stale book.
const BOOK_DB = 'c4book';
const BOOK_STORE = 'files';

function openBookDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BOOK_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(BOOK_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedBook(key) {
  try {
    const db = await openBookDB();
    return new Promise(resolve => {
      const tx = db.transaction(BOOK_STORE, 'readonly');
      const req = tx.objectStore(BOOK_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cacheBook(key, data) {
  try {
    const db = await openBookDB();
    return new Promise(resolve => {
      const tx = db.transaction(BOOK_STORE, 'readwrite');
      tx.objectStore(BOOK_STORE).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore cache errors
  }
}

/**
 * Analyze a position: compute scores for every column of the current board.
 * @param {string} moves - Move string (column digits)
 * @returns {number[]} Array of WIDTH scores. Positive = current player wins, negative = loses, 0 = draw, -1000 = invalid/full.
 */
export async function analyze(moves) {
  const mod = await initModule();
  const width = currentWidth;
  if (hasBook() && !bookLoaded) await loadOpeningBook();

  const ptr = mod.ccall('analyze', 'number', ['string'], [moves]);

  // Read one int per column from the returned pointer
  const scores = [];
  for (let i = 0; i < width; i++) {
    scores.push(mod.getValue(ptr + i * 4, 'i32'));
  }
  return scores;
}

/**
 * Solve a single position.
 * @param {string} moves - Move string
 * @param {boolean} weak - If true, only determine win/draw/loss (faster)
 * @returns {number} Score for current player
 */
async function solve(moves, weak = false) {
  const mod = await initModule();
  if (hasBook() && !bookLoaded) await loadOpeningBook();

  return mod.ccall('solve', 'number', ['string', 'number'], [moves, weak ? 1 : 0]);
}

/**
 * Get the node count from the last computation.
 */
async function getNodeCount() {
  const mod = await initModule();
  return mod.ccall('get_node_count', 'number', [], []);
}

/**
 * Set the maximum number of nodes allowed for a search.
 * @param {number} limit - Maximum number of nodes, or 0 for unlimited.
 */
export async function setMaxNodes(limit) {
  const mod = await initModule();
  mod.ccall('set_max_nodes', null, ['number'], [limit]);
}

/**
 * Get solver status info.
 */
export function getStatus() {
  return {
    moduleReady: wasmModule !== null,
    width: currentWidth,
    height: currentHeight,
    hasBook: hasBook(),
    bookLoaded,
    bookLoading,
    bookError,
  };
}

/**
 * Load (or switch to) the solver for the given board dimensions and warm it
 * up. Safe to call repeatedly: a no-op if the requested size is already
 * loaded, otherwise it unloads the current module first. The opening book is
 * only fetched for the 7x6 board.
 *
 * @param {number} [width=7]
 * @param {number} [height=6]
 */
export async function init(width = 7, height = 6) {
  if (wasmModule && width === currentWidth && height === currentHeight) {
    // Already loaded for this size — just make sure the book is in.
    if (hasBook()) await loadOpeningBook();
    return;
  }

  // Switching sizes (or first load): drop any existing module first.
  if (wasmModule || modulePromise || currentScript) unload();

  currentWidth = width;
  currentHeight = height;

  await initModule();
  if (hasBook()) await loadOpeningBook();
}

/**
 * Pre-initialize everything for the current dimensions (call early to avoid a
 * delay on the first solve). Kept for backwards compatibility; prefer init().
 */
export async function warmup() {
  await init(currentWidth, currentHeight);
}
