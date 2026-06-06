# Tier C — VICTOR combination solver (scoping)

## Goal & non-goals

**Goal (player value only).** Turn the validated Allis rules into a *proof* that a
side can at least draw from a position, and render that proof as a **pairing
diagram** — a static, human-followable plan ("you own these even squares via
claimeven, this aftereven kills their column-f threats, so they can never make
four — hold this and you draw"). This is the "steady-state diagram" the app
originally had, made rigorous.

**Non-goal: helping the engine.** The WASM solver is already perfect and instant.
VICTOR makes the engine no stronger/faster. Everything here is teaching value.
The solver's role is flipped: it is our **oracle/ground truth**, used to validate
that VICTOR never claims a false proof.

## What VICTOR proves (Allis)

> If the controller can **solve all of the opponent's threats** with a
> **consistent** set of rule applications, the opponent can never complete a
> four, so the controller at least draws.

- A **threat** = an opponent group (a line of 4 with **no controller disc** — it
  could still be completed by the opponent). The controller must solve *every*
  one.
- A **rule application** (claimeven / baseinverse / aftereven / …) **solves** a
  set of threats and **uses** a set of squares.
- **Consistent** = the chosen rule applications don't use squares in conflicting
  ways (Allis gives a pairwise consistency table). This is the hard core.

Find a consistent subset of rule applications whose solved-threats cover all
threats → proof found → the subset *is* the pairing.

## Data model

```
Threat   = { cells: [4 squares], emptySquares: [...] }   // opponent group, no controller disc
RuleApp  = { type, solves: Set<threatId>, uses: Set<squareKey>, claims: Set<squareKey> }
Solution = RuleApp[]   // consistent, covering all threats
```

Per-rule `solves` / `uses` (controller = even player / player 2 for the rules we have):
- **claimeven(pair a,b)**: solves every threat containing the even square `b`; uses `{a,b}`; claims `b`.
- **baseinverse(p,q)** (two directly-playable squares): solves every threat containing **both** `p` and `q`; uses `{p,q}`.
- **aftereven(group)**: solves every threat with a square above the empty in **every** aftereven column (Allis solution 1); uses the underlying claimeven squares; also inherits their claimeven solves (solution 2).

## Algorithm (phased)

1. **Enumerate threats** — all groups with no controller disc.
2. **Generate rule applications** — every claimeven pair, baseinverse pair,
   aftereven group available on the board; compute each one's `solves`/`uses`.
3. **Search for a consistent cover** — pick rule apps so that ⋃`solves` = all
   threats and no two conflict. This is set-cover-with-conflicts (NP-ish, but the
   board is tiny — greedy + backtracking is fine, as Allis found).
4. **If covered → emit the pairing**; else → "no rule-based proof" (which, when
   the solver says the controller *does* hold, means we're missing rules/consistency).

## Consistency (the real work — now implemented)

Allis defines pairwise consistency between every rule type (§7.4, a 9×9 table
with four constraint codes). VICTOR now implements that table verbatim — see
`consistent()` in `app/learn/victor.js` and the transcription in
`docs/allis-rules-reference.md`. The four codes:
1. squares disjoint;
2. no Claimeven of the other rule below the inverse (we also require disjoint —
   any non-disjoint case is a claimeven-below anyway);
3. column-wise disjoint or equal (lets two Afterevens/Befores share a Claimeven);
4. squares disjoint AND the inverses' column-sets disjoint or equal.

**Why not plain disjoint-squares (the Phase-1 model):** Allis diagram 7.2 shows a
Claimeven and a Lowinverse with *fully disjoint squares* that cannot be combined
(the claimeven sits below the inverse and flips the Zugzwang parity). A
disjoint-only test is therefore unsound; the oracle caught exactly this as false
proofs the moment Lowinverse coexisted with Claimeven. The §7.4 table is the fix.

## Validation (free, via the solver)

- **Soundness (must hold):** if VICTOR finds a cover ⇒ the solver must confirm the
  controller is **not losing**. A "covered but solver says loss" is a
  consistency/solves bug — exactly what the oracle catches (as it did for
  claimeven/baseinverse).
- **Coverage (informative):** among positions the solver says the controller
  holds, how many can our *current* rule set cover? That fraction tells us how
  much the remaining rules matter. (See `scripts/victor-poc.mjs`.)

## Honest caveats

- Connect 4 is a **first-player win**, so the clean "hold the draw" pairing is the
  **second player's** story, and it only exists in positions that *are* drawn
  (mid-game, after a first-player slip). From the empty board there is no draw
  pairing for Black — VICTOR correctly finds none (that's how Allis proved White
  wins).
- The **winning** side's plan is different (an odd threat + zugzwang), not a
  drawing pairing. A full teaching tool eventually wants both framings.
- Rendering a pairing *legibly* is its own UX task (Phase 3).

## Build phases

- **Phase 0 (now): PoC** — coverage + soundness spike on solver-labelled
  positions with the current 3 rules. Quantify the gap. Decide go/no-go.
- **Phase 1 (done):** disjoint-squares cover search; soundness green against the
  solver. (Later shown to be a *latent* unsoundness — see Phase 2.)
- **Phase 2 (done):** all eight productive rules
  (claimeven/baseinverse/vertical/aftereven/lowinverse/highinverse/baseclaim/
  before) with the real Allis §7.4 consistency table. Specialbefore is omitted —
  its solve-set text is ambiguous and a literal reading produced false proofs in
  combination (Allis rates its impact "probably not significant"). Soundness:
  **0 false proofs** over ~16k solver-labelled positions across seeds; coverage
  of player-2-holds positions ≈ 5% (up from ~2%). The ceiling is structural —
  the even controller can't claim a lone odd square, and Connect-4 is a
  first-player win, so clean player-2 draw-pairings are inherently rare.
- **Player-1 win prover (done):** `solveWhiteWin` (Allis §8.2) — reuses the whole
  §7.4 engine. White wins if it has an immediate winning move (White to move) or a
  standing **odd threat** (→ Zugzwang control) plus a consistent refutation of all
  of Black's threats on the rest of the board (controller = 1, odd-threat column
  reserved). `npm run test:victor:white`. **0 false proofs** over ~16k positions
  (seeds); coverage of solver White-wins ≈ **49%** — but ~96% of that is trivial
  immediate wins; the genuine odd-threat proofs are ~2% (the same hard full-cover
  problem as the draw case). Gotcha fixed: an immediate winning square only wins
  if it is **White's** turn (compute the mover from the disc count).
- **Threat combinations (§8.4, full claims encoded):** `findThreatCombinations`
  + the threat-combination branch of `solveWhiteWin` (reserve both columns; refute
  Black via Allis's per-type claims). All claims are now implemented — the verbatim
  text is in `docs/allis-rules-reference.md`. The "Black cannot get X" claims (1–4
  for type 1, 1–2 for type 2) kill threats; the claims that hand White a square
  (the lowest-squares Baseinverse, the answered pairing in the other column) relax
  the column reservation instead. **0 false proofs** across seeds (Allis does not
  prove these — the solver is the oracle), but they close a full cover for only
  ~3 in 40 000 random positions: combinations occur too early, with too many Black
  threats across the free columns. The payoff is the teaching diagram (the forced
  double threat is worth *showing*), not coverage.
- **Player-2 (Black) win prover (done):** `solveBlackWin` — Allis §9.2's own
  "minor modification". Run the drawing cover (controller = 2); if the chosen set
  contains an **Aftereven**, Black does not merely hold, it **wins** (the aftereven
  group is a Black four whose gaps are even squares Black is guaranteed). The
  natural mirror of `solveWhiteWin` (which keys off an *odd* threat). Self-
  protecting: an unrefuted White odd threat is unsolvable, so the cover cannot
  close and no win is claimed. `npm run test:victor:black` — **0 false proofs**,
  coverage of Black wins ≈ 43–46% (mostly trivial immediate wins, the rest genuine
  aftereven wins), symmetric with the White prover. This delivers the same
  win-pairing data for whichever player the solver says is winning.
- **Phase 3 (done):** render the pairing as the Learn-mode diagram.
  `app/learn/pairing.js` (`buildPairing`) runs the right prover for the position's
  solver verdict — `solveWhiteWin` if the first player wins, `solveBlackWin` if the
  second player wins, else `solveVictor` if player 2 only holds — and only when a
  proof is found. It returns a `winner` (1/2) so the card can title the win
  correctly. The store exposes a `pairing` getter and a `showPairing` toggle;
  `BoardArea` overlays reserved squares as violet diamonds with per-rule rings and
  marks the focal squares with a gold star — the odd threat / combination squares
  for a White win, the aftereven's even squares for a Black win (the immediate-win
  square gets ✦); `LearnCard` shows a "Reveal the plan" button, a headline (first-
  player win / second-player win / at-least-a-draw), the anchor line, the rule
  breakdown, and how many opponent fours it answers. Verified live (Playwright):
  immediate, odd-threat, draw, and the **second-player aftereven win** (moves
  `62651533322`, solver "P2 wins in 21") all render with zero console errors. Note:
  the draw proof is a *floor* ("at least a draw"), so that headline is worded that
  way — it fires soundly even when player 2 is actually winning but no aftereven
  closed the cover.
