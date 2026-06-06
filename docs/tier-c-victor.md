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

## Consistency (the real work)

Allis defines pairwise consistency between every rule type. The dominant cases
for our three rules:
- Two claimevens are consistent unless they share a square.
- A claimeven and a baseinverse conflict if they use the same square.
- Aftereven is built from claimevens; it inherits their squares for conflict
  purposes.
The remaining rules (vertical, lowinverse, highinverse, baseclaim, before,
specialbefore) exist **only** to solve threats the basic rules can't, and bring
their own consistency rows. We add them *as the PoC shows coverage gaps demand*,
not speculatively.

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
- **Phase 1:** consistency for claimeven/baseinverse/aftereven + greedy/backtrack
  cover search; soundness green against the solver.
- **Phase 2:** add the missing rules until coverage of solver-drawn positions is
  high.
- **Phase 3:** render the pairing as the Learn-mode diagram.
