/**
 * JS wrapper for the Connect 4 WASM solver.
 * Loads the WASM module, fetches and mounts the opening book,
 * and exposes an async analyze(moves) → scores[7] interface.
 *
 * Original solver by Pascal Pons — http://connect4.gamesolver.org
 * Licensed under AGPL-3.0
 */

let modulePromise = null;
let wasmModule = null;

// Keep track of opening book status
let bookLoaded = false;
let bookLoading = false;
let bookError = null;

/**
 * Initialize the WASM module. Called once, cached thereafter.
 */
async function initModule() {
  if (wasmModule) return wasmModule;
  if (modulePromise) return modulePromise;

  modulePromise = (async () => {
    // Load Emscripten glue code via <script> since it lives in /public
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/wasm/c4solver.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load WASM glue script'));
      document.head.appendChild(script);
    });
    const createC4Solver = globalThis.createC4Solver;
    if (!createC4Solver) throw new Error('createC4Solver not found after loading script');
    wasmModule = await createC4Solver({
      locateFile: path => `/wasm/${path}`,
    });
    return wasmModule;
  })();

  return modulePromise;
}

/**
 * Fetch the opening book and mount it in the WASM virtual filesystem.
 * The book is cached in IndexedDB so it's only downloaded once.
 */
async function loadOpeningBook() {
  if (bookLoaded || bookLoading) return;
  bookLoading = true;
  bookError = null;

  try {
    const mod = await initModule();

    // Try loading from IndexedDB cache first
    let bookData = await getCachedBook();

    if (!bookData) {
      // Fetch from server
      const response = await fetch('/wasm/7x6.book');
      if (!response.ok) throw new Error(`Failed to fetch opening book: ${response.status}`);
      bookData = new Uint8Array(await response.arrayBuffer());

      // Cache in IndexedDB for future loads
      await cacheBook(bookData);
    }

    // Write to Emscripten virtual filesystem
    mod.FS.writeFile('/7x6.book', bookData);

    // Tell the solver to load it
    mod.ccall('load_book', 'number', ['string'], ['/7x6.book']);

    bookLoaded = true;
  } catch (e) {
    bookError = e.message;
    console.error('Failed to load opening book:', e);
  } finally {
    bookLoading = false;
  }
}

// IndexedDB helpers for caching the opening book
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

async function getCachedBook() {
  try {
    const db = await openBookDB();
    return new Promise(resolve => {
      const tx = db.transaction(BOOK_STORE, 'readonly');
      const req = tx.objectStore(BOOK_STORE).get('7x6.book');
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cacheBook(data) {
  try {
    const db = await openBookDB();
    return new Promise(resolve => {
      const tx = db.transaction(BOOK_STORE, 'readwrite');
      tx.objectStore(BOOK_STORE).put(data, '7x6.book');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore cache errors
  }
}

/**
 * Analyze a position: compute scores for all 7 columns.
 * @param {string} moves - Move string (digits 1-7)
 * @returns {number[]} Array of 7 scores. Positive = current player wins, negative = loses, 0 = draw, -1000 = invalid/full.
 */
export async function analyze(moves) {
  const mod = await initModule();
  if (!bookLoaded) await loadOpeningBook();

  const ptr = mod.ccall('analyze', 'number', ['string'], [moves]);

  // Read 7 ints from the returned pointer
  const scores = [];
  for (let i = 0; i < 7; i++) {
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
export async function solve(moves, weak = false) {
  const mod = await initModule();
  if (!bookLoaded) await loadOpeningBook();

  return mod.ccall('solve', 'number', ['string', 'number'], [moves, weak ? 1 : 0]);
}

/**
 * Get the node count from the last computation.
 */
export async function getNodeCount() {
  const mod = await initModule();
  return mod.ccall('get_node_count', 'number', [], []);
}

/**
 * Get solver status info.
 */
export function getStatus() {
  return {
    moduleReady: wasmModule !== null,
    bookLoaded,
    bookLoading,
    bookError,
  };
}

/**
 * Pre-initialize everything (call early to avoid delay on first solve).
 */
export async function warmup() {
  await initModule();
  await loadOpeningBook();
}

export default {analyze, solve, getNodeCount, getStatus, warmup};
