# Allis rule reference (verbatim solve-sets + consistency table)

Transcribed from V. Allis, *A Knowledge-based Approach of Connect-Four* (1988),
§6 (rules) and §7 (interaction), the canonical tromp.github.io PDF. This is the
ground truth for VICTOR (`app/learn/victor.js`); every rule's `solves`/`uses`
and the consistency check must match this, validated against the WASM solver
(`npm run test:victor`, target **0 false proofs**).

**Controller = Black = player 2 (the even controller).** Opponent = White =
player 1. The rules refute the opponent's (player-1) threats. "Odd" / "even"
squares use 1-indexed rows from the bottom: odd = rows 1,3,5 (0-based r=0,2,4),
even = rows 2,4,6 (0-based r=1,3,5).

## Rules — Required & Solutions (verbatim)

- **Claimeven** — Required: two squares directly above each other, both empty,
  upper square **even**. Solutions: all groups containing the **upper** square.
  Uses {lower, upper}.
- **Baseinverse** — Required: two directly playable squares. Solutions: all
  groups containing **both** squares. Uses {both}.
- **Vertical** — Required: two squares directly above each other, both empty,
  upper square **odd**. Solutions: all groups containing **both** squares (only
  vertical fours qualify). Uses {both}. *Zugzwang-independent.*
- **Aftereven** — Required: a group the controller can complete using only the
  even squares of a set of Claimevens (the Aftereven group); its empty columns
  are the Aftereven columns. Solutions: (1) all groups with ≥1 square in **all**
  Aftereven columns **above** the empty square of the Aftereven group in that
  column; (2) all groups solved by the constituent Claimevens. Uses = the
  claimeven squares.
- **Lowinverse** — Required: two different columns, each two squares directly
  above each other, all four empty, in both columns the **upper square odd**
  (i.e. two Verticals). Solutions: (1) all groups containing **both upper
  squares**; (2) all groups solved by the two Verticals. Uses {all 4}.
- **Highinverse** — Required: two different columns, each **three** squares
  stacked, all six empty, in both columns the **upper square even**. Per column
  low/mid/up. Solutions: (1) groups containing **both upper** squares; (2) groups
  containing **both middle** squares; (3) (vertical) groups containing the two
  highest (mid+up) of **one** column; (4) if low₁ directly playable: groups
  containing {low₁, up₂}; (5) if low₂ directly playable: groups containing
  {low₂, up₁}. Uses {all 6}.
- **Baseclaim** — Required: three directly playable squares + the square above
  the **second** playable square; that non-playable square **even**. Number
  columns so the even square z is above playable p₂. Solutions: (1) groups
  containing {p₁, z}; (2) groups containing {p₂, p₃}. Uses {p₁,p₂,p₃,z}.
- **Before** — Required: a group with **no opponent (player-1) man** (the Before
  group); all its empty squares **not in the top row**. Solutions: (1) all groups
  containing **all successors** (square directly above) of the Before group's
  empty squares; (2) groups solved by the constituent Verticals; (3) groups
  solved by the constituent Claimevens. For each empty square e: (e,e+1) is a
  Claimeven if e is odd-parity, a Vertical if e is even-parity. Uses = ∪{e,e+1}.
  (If all-claimeven it's just an Aftereven — only use Before when Aftereven can't.)
- **Specialbefore** — a Before group with one empty square **directly playable**,
  plus an extra directly-playable square x in **another** column. Solutions: (1)
  groups containing all successors of the Before group's empties **and** x; (2)
  groups containing the two playable squares (internal playable empty + x); (3)/(4)
  groups solved by the constituent Claimevens / Verticals. Uses = before ∪ {x}.

## Consistency table (§7.4) — constraint code per unordered pair

```
      CL  BI  VE  AE   LI   HI   BC  BE  SB
CL     1
BI     1   1
VE     1   1   1
AE     1   1   1   3
LI     2   1   1  1&2   4
HI     2   1   1  1&2   4    4
BC     1   1   1   1   1&2  1&2   1
BE     1   1   1   3   2&3  1&2   1   3
SB     1   1   1   3   2&3  1&2   1   3   3
```

Constraint codes:
1. Allowed if the sets of **squares are disjoint**.
2. Allowed if **no Claimeven** (of the other rule) is **below the inverse** (same
   column, lower than the inverse's lowest reserved square).
3. Allowed if the sets of squares are **column-wise disjoint or equal** (per
   column, both rules use the identical square set, or one uses none).
4. Allowed if **squares disjoint AND** the inverses' **column-sets disjoint or
   equal**.

N.B. "1&2" / "2&3" = both constraints must hold. The Specialbefore's two special
squares are treated as never equal to another rule's squares.

Key soundness fact (diagram 7.2): a Claimeven *below* a Lowinverse has **disjoint
squares** yet is **inconsistent** — constraint 2, not 1, governs CL–LI. A pure
disjoint-squares check is therefore unsound; VICTOR must implement the table.

The unifying principle (§7.1): two rules combine iff, once one rule's squares are
filled, the number of newly-available squares is **even** (Zugzwang preserved).
Vertical and Baseinverse are Zugzwang-independent → combine with anything if
disjoint.

## Player-1 (White) win strategy (§8.1–8.2)

White normally does **not** control the Zugzwang; it needs an **odd threat** to
take it. An *odd threat* is a group with three White discs and one empty square,
that square on an **odd** row and **not directly playable** (a standing threat).
Given one, Black is eventually forced to concede it, so:

> In the odd-threat's column, **Black can never complete a group needing a square
> at or above the threat** — White owns the odd squares up to and including the
> threat (except the lowest odd square if it is directly playable).

So White wins if: it holds an odd threat **and** can refute every one of Black's
threats on the *rest* of the board using the very same strategic rules above
(now applied with White as the Zugzwang controller). The rules are sound for
White only **because** the odd threat gives it Zugzwang control — never run the
White cover without one. Implemented as `solveWhiteWin` in `app/learn/victor.js`
(odd threat + the §7.4 cover, controller = 1, the odd-threat column reserved).

**Threat combinations (§8.3–8.4) — detected + integrated, conservatively.** When
White has no odd threat *yet* but two half-filled groups force one, White still
wins. Definition (§8.4): two White half-groups (2 discs + 2 empties each). The
*odd group* needs two odd squares; the *even group* needs one of them — the
*crossing square* (shared, NOT directly playable) — plus an even square directly
above/below the *other* odd square, in that column. Two types: even-above-odd /
odd-above-even. `findThreatCombinations` in `app/learn/victor.js` detects these;
`solveWhiteWin` reserves both columns and auto-refutes via the two robust claims
common to all types: (1) Black gets no odd square in the crossing column above
the first playable; (2) Black can never get *both* a square above the crossing
square AND a square above the other odd square (White wins first).

**The full per-type claims are now encoded** (the verbatim §8.4 text is below).
Allis warns they "rely entirely on variant analysis" and does not prove them, so
each is validated against the perfect solver instead: `npm run test:victor:white`
finds **0 false proofs**. They are still rarely decisive — combinations occur
mostly in early positions with too many Black threats to refute across the free
columns, so the full cover closes for only ~3 in 40 000 random positions even
with claims 3–6. Their real payoff is the teaching diagram (showing the forced
double threat); the coverage gain is marginal but the machinery is sound and
end-to-end. The "Black cannot get square X" claims kill threats; the claims that
*hand White a square* (the lowest-squares Baseinverse, the answered pairing in
the other column) instead **relax** the otherwise total reservation of the two
columns — encoded as a permitted Baseinverse on the two bases and permitted
Verticals confined to the other column at/below the odd square.

### §8.4 threat-combination claims (verbatim)

A threat combination is two groups, each filled with two men. One group needs two
odd squares; the second needs one of them (the **crossing square**, which must
*not* be directly playable) plus another even square directly above or beneath
the second odd square of the first group.

**Type 1 — even square above the odd square.** White's claims:
1. Black gets no odd squares in the crossing column (except a first directly playable square).
2. Black will not get both a square above the crossing square and a square above the odd square in the other column (after both are played White has already won, so above at least one of them no moves are made).
3. Black will not get both the square above the crossing square and the odd square in the other column.
4. If the odd square in the other column is playable, the highest square in the crossing column Black can take is the square directly above the crossing square.
5. If the first empty square in the crossing column is odd and the odd square in the other column is not directly playable, a Baseinverse can be used on the lowest squares of both columns, giving one to White.
6. In the other column each opponent move is answered, giving (at least) one of every two squares to White up to and including the odd square in that column. If claim 5 is applied, this starts one square higher.

**Type 2 — odd square above even square.** If the even square is *not* directly
playable: claims 1 and 2 as above, plus (3) the lowest-squares Baseinverse of
type-1 claim 5, and (4) the answered-pairing of type-1 claim 6. If the even
square *is* directly playable: only claims 1 and 2 hold.

## Detecting a Black WIN (not just a draw) — Allis §9.2

Allis's own "minor modification": run the ordinary drawing cover (controller =
player 2); **if the chosen set of solutions contains an Aftereven, Black wins**,
not merely draws. The aftereven group is a Black line of four whose every gap is
an even square Black is guaranteed via Claimeven, so once the plan also refutes
all of White's threats Black is free to complete that four. Implemented as
`solveBlackWin` (the natural mirror of `solveWhiteWin`, which keys off an *odd*
threat). It is self-protecting: an unrefuted White odd threat is an unsolvable
group, so the cover cannot close and no win is claimed. `npm run
test:victor:black` — **0 false proofs**, coverage of Black wins ≈ 43–46% (mostly
trivial immediate wins, the rest genuine aftereven wins), symmetric with White.
