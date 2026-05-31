/*
  Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
  Copyright (C) 2026 Khodok

  This file is part of Connect4 Game Solver.

  Connect4 Game Solver is free software: you can redistribute it and/or
  modify it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  Connect4 Game Solver is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
*/

/*
  Game recap: builds a shareable summary of a finished game from raw store
  state. Pure, dependency-free — image output is hand-written SVG, optionally
  rasterised to PNG/JPEG through a <canvas>. Uses the term "ply" throughout.
*/

const COLS = 7;
const ROWS = 6;

/* ── Move-quality tiers (chess-style, score-delta driven) ─────────────── */

export const TIERS = ['best', 'good', 'inaccuracy', 'mistake', 'blunder', 'unknown'];

export const TIER_META = {
  best: {label: 'Best', symbol: '★', color: 'oklch(0.78 0.15 150)', weight: 1},
  good: {label: 'Good', symbol: '', color: 'oklch(0.82 0.13 130)', weight: 0.9},
  inaccuracy: {label: 'Inaccuracy', symbol: '?!', color: 'oklch(0.85 0.15 95)', weight: 0.65},
  mistake: {label: 'Mistake', symbol: '?', color: 'oklch(0.74 0.17 55)', weight: 0.35},
  blunder: {label: 'Blunder', symbol: '??', color: 'oklch(0.63 0.22 25)', weight: 0},
  unknown: {label: 'Unknown', symbol: '', color: 'oklch(0.62 0.02 265)', weight: null},
};

/**
 * Classify a single ply by comparing the played score to the best available
 * one (both from the mover's perspective, higher = better). Outcome flips
 * (throwing away a win or a non-loss) dominate raw magnitude.
 */
export function classifyPly(played, best) {
  if (played == null || best == null || Number.isNaN(played) || Number.isNaN(best)) return 'unknown';
  const delta = best - played;
  if (delta <= 0) return 'best';
  if (best >= 0 && played < 0) return 'blunder'; // traded a non-loss for a loss
  if (best > 0 && played === 0) return 'mistake'; // traded a win for a draw
  if (delta <= 2) return 'good';
  if (delta <= 5) return 'inaccuracy';
  if (delta <= 9) return 'mistake';
  return 'blunder';
}

/* ── Recap model ──────────────────────────────────────────────────────── */

function normalizeWinningCells(cells) {
  const set = new Set();
  if (!Array.isArray(cells)) return set;
  for (const cell of cells) {
    if (Array.isArray(cell)) set.add(`${cell[0]},${cell[1]}`);
    else if (cell && typeof cell === 'object') {
      const r = cell.r ?? cell.row;
      const c = cell.c ?? cell.col;
      if (r != null && c != null) set.add(`${r},${c}`);
    }
  }
  return set;
}

function accuracyOf(plies) {
  const graded = plies.filter((p) => TIER_META[p.quality].weight != null);
  if (!graded.length) return null;
  const sum = graded.reduce((acc, p) => acc + TIER_META[p.quality].weight, 0);
  return Math.round((sum / graded.length) * 100);
}

/**
 * Build the recap model from a plain snapshot of store state. Kept
 * framework-agnostic so it can be unit-tested without Pinia.
 */
export function buildRecap({
  board,
  moves,
  moveScores = [],
  moveBestScores = [],
  moveBestCols = [],
  winner = 0,
  winningCells = [],
  color1,
  color2,
  date = new Date(),
}) {
  const plies = moves.map((col, i) => {
    const score = moveScores[i] ?? null;
    const bestScore = moveBestScores[i] ?? null;
    const bestCol = moveBestCols[i] != null ? moveBestCols[i] : null; // already 1-indexed
    const quality = classifyPly(score, bestScore);
    return {
      n: i + 1, // ply number, 1-based
      player: (i % 2) + 1, // first ply is player 1
      col, // 1-indexed column played
      score,
      bestScore,
      bestCol,
      delta: score != null && bestScore != null ? bestScore - score : null,
      quality,
    };
  });

  const counts = Object.fromEntries(TIERS.map((t) => [t, 0]));
  for (const p of plies) counts[p.quality]++;

  const isDraw = winner === 0 && plies.length >= ROWS * COLS;
  const result = winner === 1 ? 'Player 1 wins' : winner === 2 ? 'Player 2 wins' : isDraw ? 'Draw' : 'In progress';

  return {
    plies,
    board,
    winningCells: normalizeWinningCells(winningCells),
    colors: {color1, color2},
    moveString: moves.join(''),
    date,
    summary: {
      totalPlies: plies.length,
      winner,
      isDraw,
      result,
      counts,
      accuracy: accuracyOf(plies),
      accuracyP1: accuracyOf(plies.filter((p) => p.player === 1)),
      accuracyP2: accuracyOf(plies.filter((p) => p.player === 2)),
    },
  };
}

/* ── Text export (for data crunchers, no image) ───────────────────────── */

function fmtScore(s) {
  if (s == null) return '?';
  return s > 0 ? `+${s}` : `${s}`;
}

function pad(str, len, right = false) {
  str = String(str);
  const gap = ' '.repeat(Math.max(0, len - str.length));
  return right ? str + gap : gap + str;
}

export function recapToText(recap) {
  const {summary, plies, board, moveString, date} = recap;
  const lines = [];

  lines.push('Connect 4 — Game Recap');
  lines.push(date.toLocaleString());
  lines.push('');
  lines.push(`Result:   ${summary.result} (${summary.totalPlies} plies)`);
  lines.push(`Moves:    ${moveString || '(none)'}`);

  const acc = summary.accuracy == null ? '—' : `${summary.accuracy}%`;
  const p1 = summary.accuracyP1 == null ? '—' : `${summary.accuracyP1}%`;
  const p2 = summary.accuracyP2 == null ? '—' : `${summary.accuracyP2}%`;
  lines.push(`Accuracy: ${acc}  (P1 ${p1} · P2 ${p2})`);

  const q = summary.counts;
  lines.push(
    `Quality:  ${q.best} Best · ${q.good} Good · ${q.inaccuracy} Inaccuracy · ${q.mistake} Mistake · ${q.blunder} Blunder`,
  );
  lines.push('');

  lines.push(`${pad('Ply', 4)} ${pad('By', 3)} ${pad('Col', 4)} ${pad('Score', 6)} ${pad('Best', 6)}  Quality`);
  for (const p of plies) {
    const best = p.quality === 'best' ? fmtScore(p.bestScore) : `${fmtScore(p.bestScore)}→c${p.bestCol ?? '?'}`;
    const meta = TIER_META[p.quality];
    const tier = `${meta.label}${meta.symbol ? ' ' + meta.symbol : ''}`;
    lines.push(
      `${pad(p.n, 4)} ${pad('P' + p.player, 3)} ${pad('c' + p.col, 4)} ${pad(fmtScore(p.score), 6)} ${pad(best, 6)}  ${tier}`,
    );
  }

  lines.push('');
  lines.push('Final board:');
  lines.push('1 2 3 4 5 6 7');
  for (let r = ROWS - 1; r >= 0; r--) {
    lines.push(board[r].map((v) => (v === 0 ? '.' : v === 1 ? '1' : '2')).join(' '));
  }
  lines.push('');
  lines.push('Generated by connect4-solver · github.com/Khoding/connect4-solver');

  return lines.join('\n');
}

/* ── SVG export (the shareable artifact) ──────────────────────────────── */

const THEME = {
  bg: 'oklch(0.19 0.025 265)',
  panel: 'oklch(0.23 0.03 265)',
  border: 'oklch(0.42 0.03 265)',
  board: 'oklch(0.5 0.15 255)',
  boardHi: 'oklch(0.58 0.16 255)',
  hole: 'oklch(0.15 0.02 265)',
  text: 'oklch(0.96 0.01 265)',
  dim: 'oklch(0.72 0.02 265)',
  accent: 'oklch(0.82 0.12 200)',
};

const FONT =
  "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, monospace";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Draw just the board diagram, translated to (ox, oy). Returns {svg, w, h}. */
function boardGroup(recap, ox, oy) {
  const cell = 52;
  const ipad = 12;
  const r = Math.round(cell * 0.4);
  const w = COLS * cell + 2 * ipad;
  const h = ROWS * cell + 2 * ipad;
  const {color1, color2} = recap.colors;

  let s = `<g transform="translate(${ox},${oy})">`;
  s += `<rect width="${w}" height="${h}" rx="18" fill="${THEME.board}" stroke="${THEME.boardHi}" stroke-width="2"/>`;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = ipad + col * cell + cell / 2;
      const cy = ipad + row * cell + cell / 2;
      const y = ROWS - 1 - row; // board[0] is the bottom row; draw top-down
      const v = recap.board[y][col];
      const won = recap.winningCells.has(`${y},${col}`);
      if (v === 0) {
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${THEME.hole}"/>`;
      } else {
        const fill = v === 1 ? color1 : color2;
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
        if (won) {
          s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="oklch(0.99 0 0)" stroke-width="3.5"/>`;
          s += `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="oklch(0.99 0 0 / 0.4)" stroke-width="2"/>`;
        }
      }
    }
  }
  s += `</g>`;
  return {svg: s, w, h};
}

/** Build the full recap card. Returns {svg, width, height}. */
export function recapCardSvg(recap) {
  const W = 660;
  const P = 32;
  const {summary, plies, colors} = recap;
  const parts = [];
  let y = P;

  /* Header */
  parts.push(
    `<text x="${P}" y="${y + 26}" font-family="${FONT}" font-size="26" font-weight="700" fill="${THEME.text}">Connect 4 — Game Recap</text>`,
  );
  parts.push(
    `<text x="${W - P}" y="${y + 12}" text-anchor="end" font-family="${FONT}" font-size="13" fill="${THEME.dim}">${esc(recap.date.toLocaleDateString())}</text>`,
  );
  y += 44;

  /* Result badge */
  parts.push(`<circle cx="${P + 8}" cy="${y + 6}" r="8" fill="${colors.color1}"/>`);
  parts.push(`<circle cx="${P + 28}" cy="${y + 6}" r="8" fill="${colors.color2}"/>`);
  parts.push(
    `<text x="${P + 46}" y="${y + 11}" font-family="${FONT}" font-size="17" font-weight="600" fill="${THEME.accent}">${esc(summary.result)}</text>`,
  );
  parts.push(
    `<text x="${W - P}" y="${y + 11}" text-anchor="end" font-family="${FONT}" font-size="14" fill="${THEME.dim}">${summary.totalPlies} plies</text>`,
  );
  y += 30;

  /* Board */
  const board = boardGroup(recap, (W - (COLS * 52 + 24)) / 2, y);
  parts.push(board.svg);
  y += board.h + 28;

  /* Accuracy + tier legend */
  const accLabel = summary.accuracy == null ? '—' : `${summary.accuracy}%`;
  parts.push(
    `<text x="${P}" y="${y + 14}" font-family="${FONT}" font-size="13" fill="${THEME.dim}">ACCURACY</text>`,
  );
  parts.push(
    `<text x="${P}" y="${y + 56}" font-family="${FONT}" font-size="44" font-weight="800" fill="${THEME.text}">${accLabel}</text>`,
  );
  const p1 = summary.accuracyP1 == null ? '—' : `${summary.accuracyP1}%`;
  const p2 = summary.accuracyP2 == null ? '—' : `${summary.accuracyP2}%`;
  parts.push(
    `<text x="${P}" y="${y + 78}" font-family="${FONT}" font-size="13" fill="${THEME.dim}">P1 ${p1}  ·  P2 ${p2}</text>`,
  );

  /* Tier counts (right column) */
  const legendX = W - P - 200;
  let ly = y + 6;
  for (const t of TIERS) {
    if (t === 'unknown' && summary.counts.unknown === 0) continue;
    const meta = TIER_META[t];
    parts.push(`<circle cx="${legendX + 6}" cy="${ly + 8}" r="6" fill="${meta.color}"/>`);
    parts.push(
      `<text x="${legendX + 20}" y="${ly + 13}" font-family="${FONT}" font-size="14" fill="${THEME.text}">${meta.label}</text>`,
    );
    parts.push(
      `<text x="${W - P}" y="${ly + 13}" text-anchor="end" font-family="${MONO}" font-size="14" fill="${THEME.dim}">${summary.counts[t]}</text>`,
    );
    ly += 22;
  }
  y = Math.max(y + 90, ly) + 8;

  /* Quality timeline */
  parts.push(
    `<text x="${P}" y="${y + 12}" font-family="${FONT}" font-size="13" fill="${THEME.dim}">QUALITY BY PLY</text>`,
  );
  y += 22;
  const barW = W - 2 * P;
  const segGap = plies.length > 1 ? 2 : 0;
  const segW = plies.length ? (barW - segGap * (plies.length - 1)) / plies.length : barW;
  plies.forEach((p, i) => {
    const x = P + i * (segW + segGap);
    parts.push(`<rect x="${x.toFixed(2)}" y="${y}" width="${segW.toFixed(2)}" height="26" rx="3" fill="${TIER_META[p.quality].color}"/>`);
  });
  y += 26 + 28;

  /* Per-ply move table (up to 2 columns) */
  const ncols = plies.length > 12 ? 2 : 1;
  const rows = Math.ceil(plies.length / ncols);
  const colW = (W - 2 * P) / ncols;
  const rowH = 22;
  parts.push(
    `<text x="${P}" y="${y + 12}" font-family="${FONT}" font-size="13" fill="${THEME.dim}">MOVES</text>`,
  );
  y += 24;
  plies.forEach((p, i) => {
    const colIdx = Math.floor(i / rows);
    const rowIdx = i % rows;
    const x = P + colIdx * colW;
    const ty = y + rowIdx * rowH + 12;
    const meta = TIER_META[p.quality];
    const dotColor = p.player === 1 ? colors.color1 : colors.color2;
    parts.push(`<circle cx="${x + 4}" cy="${ty - 4}" r="4" fill="${dotColor}"/>`);
    let line = `${pad(p.n, 2)}. c${p.col}  ${pad(fmtScore(p.score), 3)}`;
    if (p.quality !== 'best' && p.bestCol != null) line += ` → c${p.bestCol}`;
    parts.push(
      `<text x="${x + 16}" y="${ty}" font-family="${MONO}" font-size="13" fill="${THEME.text}" xml:space="preserve">${esc(line)}</text>`,
    );
    parts.push(`<circle cx="${x + colW - 16}" cy="${ty - 4}" r="5" fill="${meta.color}"/>`);
  });
  y += rows * rowH + 16;

  /* Footer */
  parts.push(`<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="${THEME.border}" stroke-width="1"/>`);
  y += 20;
  parts.push(
    `<text x="${P}" y="${y}" font-family="${MONO}" font-size="12" fill="${THEME.dim}">${esc(recap.moveString || '(start)')}</text>`,
  );
  parts.push(
    `<text x="${W - P}" y="${y}" text-anchor="end" font-family="${FONT}" font-size="12" fill="${THEME.dim}">connect4-solver</text>`,
  );
  y += P;

  const H = Math.round(y);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
<rect width="${W}" height="${H}" rx="20" fill="${THEME.bg}"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="19" fill="none" stroke="${THEME.border}" stroke-width="1.5"/>
${parts.join('\n')}
</svg>`;

  return {svg, width: W, height: H};
}

/* ── Rasterisation & download/copy helpers ────────────────────────────── */

export function svgToBlob(svg) {
  return new Blob([svg], {type: 'image/svg+xml;charset=utf-8'});
}

/** Render an SVG string to a PNG/JPEG Blob via canvas. */
export function svgToRaster(svg, type = 'png', scale = 2) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgToBlob(svg));
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (type === 'jpeg') {
          ctx.fillStyle = '#15171f'; // opaque backing for non-alpha formats
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Rasterisation failed'));
          },
          type === 'jpeg' ? 'image/jpeg' : 'image/png',
          type === 'jpeg' ? 0.92 : undefined,
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load SVG for rasterisation'));
    };
    img.src = url;
  });
}

export function filenameFor(recap, ext) {
  const d = recap.date;
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `connect4-recap-${stamp}.${ext}`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text, filename) {
  downloadBlob(new Blob([text], {type: 'text/plain;charset=utf-8'}), filename);
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

/** Copy an image Blob to the clipboard. Throws if unsupported. */
export async function copyImage(blob) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image copy not supported');
  }
  await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
}
