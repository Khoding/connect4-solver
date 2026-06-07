<!--
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
-->

<!--
  /guide — a long-form, scroll-through introduction to Connect 4 theory, from
  "the game is solved" through Allis's pairing rules to a practical play plan.
  Every interactive diagram is a real position whose plan is generated live by
  the same solver-validated VICTOR engine the Learn card uses, so nothing here
  can drift from what the app actually proves.

  The body prose is English-first; the interactive chrome reuses the existing
  i18n keys. Translating the essay itself is a follow-up.
-->

<template>
  <article class="guide">
    <header class="hero">
      <p class="kicker">The complete guide</p>
      <h1>How to win at Connect&nbsp;4 — from the first move to a solved game</h1>
      <p class="sub">
        Connect&nbsp;4 has been completely solved: with perfect play the first player always wins.
        This page takes you from the bare rules all the way to reading a board like the engine does
        — and every diagram below is a real position whose plan is drawn by the same proof machine
        that powers the solver.
      </p>
      <nav class="toc" aria-label="Contents">
        <a href="#solved">1 · The game is solved</a>
        <a href="#understood">2 · Solved isn’t understood</a>
        <a href="#parity">3 · Odd and even squares</a>
        <a href="#threats">4 · Threats</a>
        <a href="#develop">5 · How to develop</a>
        <a href="#rules">6 · Claiming squares</a>
        <a href="#proof">7 · The pairing proof</a>
        <a href="#winning">8 · Forcing a win</a>
        <a href="#gm">9 · Playing like a champion</a>
      </nav>
    </header>

    <!-- 1 ───────────────────────────────────────────────── -->
    <section id="solved">
      <h2>1 · The game is already solved</h2>

      <h3>The basics first</h3>
      <p>
        Connect&nbsp;4 is played on a <strong>7-column × 6-row board</strong> — 42 slots in total.
        Two players take turns dropping a disc into any column; the disc falls to the lowest empty
        slot in that column. The first player to align four of their discs in a row —
        horizontally, vertically, or diagonally — wins. If all 42 slots fill with no winner, the
        game is a draw.
      </p>
      <p>
        A couple of words you'll see everywhere here:
      </p>
      <ul class="points">
        <li>
          <strong>Square</strong> — the standard game-theory term for a board position, even though
          the slots on this board look like circles. Every time you see "square", picture one of
          those holes.
        </li>
        <li>
          <strong>Ply</strong> — one single disc drop, one player's turn. A full game lasts at most
          42 plies (one per slot). With perfect play on both sides the first player wins on
          ply&nbsp;41, leaving exactly one empty slot.
        </li>
      </ul>
      <p>
        There are exactly <strong>69 possible four-in-a-row lines</strong> on a 7×6 board: 24
        horizontal, 21 vertical, and 24 diagonal. Every strategy in Connect&nbsp;4 is, at heart,
        a fight over which of those 69 lines each player can threaten or prevent.
      </p>

      <h3>And it turns out the whole fight is already decided</h3>
      <p>
        Connect&nbsp;4 is not a game of luck, and it is not even really a game of opinion. In 1988
        Victor Allis proved — and James Allen independently confirmed — that on the standard 7×6
        board the <strong>first player can always force a win</strong> by starting in the middle
        column. Every single one of the roughly 4.5&nbsp;trillion reachable positions has a known,
        exact value.
      </p>
      <p>
        The solver built into this site is a modern version of that result, written by
        Pascal&nbsp;Pons. Give it any position and it answers instantly:
        <em>win, lose, or draw</em>, and in how many moves. The number you see over each column is
        exactly that — a perfect score, not a guess.
      </p>
      <details class="deep">
        <summary>The rigorous version — how Pons’s solver works</summary>
        <p>
          The engine searches the game tree with <strong>negamax + alpha–beta pruning</strong>: it
          plays out lines, but as soon as a reply is found that is good enough to refute a move, it
          stops exploring that branch. The board is stored as a <strong>bitboard</strong> (two
          64-bit integers, one per player), so testing for four-in-a-row and generating moves are a
          handful of bit operations. A <strong>transposition table</strong> caches positions already
          evaluated, and an <strong>opening book</strong> stores the value of every position up to a
          fixed depth so early moves are answered without search at all.
        </p>
        <p>
          The score is encoded as <em>distance to the end</em>: a position worth +N means the winner
          connects four with N empty squares to spare, so larger magnitudes mean faster wins. Move
          ordering (centre columns first) makes alpha–beta cut enormous parts of the tree, which is
          why a trillion-position game is solved in milliseconds in your browser.
        </p>
      </details>
    </section>

    <!-- 2 ───────────────────────────────────────────────── -->
    <section id="understood">
      <h2>2 · …but “solved” is not the same as “understood”</h2>
      <p>
        A perfect score tells you <em>that</em> a position is winning. It does not tell you
        <em>why</em>, and it certainly does not teach you to find the win yourself across the board.
        For that we need a different kind of answer — a human plan.
      </p>
      <p>
        Allis’s program <strong>VICTOR</strong> produces exactly that. Instead of searching, it
        reasons with a small set of rules about which squares each player is guaranteed to get, and
        assembles them into a <strong>pairing</strong>: a fixed plan that refutes every threat the
        opponent could ever make. The rest of this page is that theory, built up one idea at a time
        — and the “Reveal the plan” button under each board shows VICTOR’s actual, solver-checked
        pairing for that position.
      </p>
    </section>

    <!-- 3 ───────────────────────────────────────────────── -->
    <section id="parity">
      <h2>3 · The secret of the board: odd and even squares</h2>
      <p>
        Number the rows 1 to 6 from the bottom. Here is the single most important fact in all of
        Connect&nbsp;4: when the endgame arrives and players are forced to fill columns from the
        bottom up, the <strong>first player tends to land on the odd rows (1, 3, 5)</strong> and the
        <strong>second player on the even rows (2, 4, 6)</strong>. Counting squares decides who is
        forced to play where — a kind of slow-motion <em>zugzwang</em>, the chess term for being
        forced to make a move you’d rather not.
      </p>
      <p>
        The whole defensive strategy of the second player flows from this: if they can quietly take
        every even square, they can neutralise everything the first player builds. Reveal the plan
        on this drawn position and you’ll see the second player claim eleven even squares — and
        nothing else is needed.
      </p>
      <PairingMiniBoard
        class="diagram"
        :example="ex('draw-claimeven')"
        caption="Second player holds the draw purely by owning the even squares."
      />
    </section>

    <!-- 4 ───────────────────────────────────────────────── -->
    <section id="threats">
      <h2>4 · Threats: the squares that win</h2>
      <p>
        A <strong>threat</strong> is an empty square that would complete a four-in-a-row for you.
        Because of the parity above, threats come in two flavours, and they are not equal:
      </p>
      <ul class="points">
        <li>
          <strong>Odd threats</strong> (on an odd row) are the first player’s weapon. The column
          holding one keeps an odd number of empty squares, so when the dust settles the first
          player is handed that square.
        </li>
        <li>
          <strong>Even threats</strong> (on an even row) are the second player’s weapon — the basis
          of the whole even-square defence.
        </li>
      </ul>
      <p>
        If both players have a good threat in different columns, the table is simple: an odd threat
        beats an even one; two odd threats, or two even ones, cancel; an even threat for the first
        player against an odd threat for the second is just a draw. Learning to
        <em>count odd against even</em> is most of what separates a strong player from a beginner.
      </p>
    </section>

    <!-- 5 ───────────────────────────────────────────────── -->
    <section id="develop">
      <h2>5 · How to develop — when no rule fires yet</h2>
      <p>
        In the first dozen or so moves, no VICTOR rule applies yet — there aren't enough discs for
        a full pairing proof to exist. The solver still knows the right move, but the reason it's
        best is positional, not rule-based. This is what the app labels <em>a developing move</em>.
        Here is how to pick one yourself.
      </p>

      <h3>1 · Start in the centre</h3>
      <p>
        Column 4 is part of more potential fours than any other column — 51 of the board's 69
        four-in-a-row lines pass through it (all 24 horizontals, all 24 diagonals, and 3 verticals).
        Columns 3 and 5 are next, then 2 and 6, then the edges. If you're not sure what to do,
        playing toward the centre is almost never a mistake.
      </p>

      <h3>2 · Land on your parity row</h3>
      <p>
        Before you drop a disc, ask: <em>which row will it land on?</em> Count the discs already in
        that column — if it's even, the next disc lands on an odd row; if odd, it lands on an even
        row. As first player you want to land on <strong>odd rows</strong> (1, 3, 5); as second
        player you want <strong>even rows</strong> (2, 4, 6). A move that lands on the wrong row
        gifts the endgame to your opponent.
      </p>

      <h3>3 · Count future threat lines</h3>
      <p>
        After dropping, count how many four-in-a-row lines you'd have at least one disc in — the
        more the better. This is exactly what the board overlay in Learn mode shows you: the
        <em>opportunity</em> squares (your embryonic threats) and the <em>danger</em> squares (your
        opponent's). A developing move that opens three new threat lines beats one that opens one,
        all else equal.
      </p>

      <h3>4 · Watch what you give away</h3>
      <p>
        Every disc you place is an invitation. Your opponent's next disc lands directly above yours
        in the same column — make sure that square doesn't hand them an immediate claimeven or a
        new threat they didn't have before. If your move inadvertently creates a danger square for
        your opponent on an even row, reconsider.
      </p>

      <h3>5 · Avoid stacking threats in one column</h3>
      <p>
        Two of your own threats in the same column cancel each other: the opponent blocks once and
        kills both. Spread your threats across different columns. The most powerful positions are
        ones where the opponent would need to be in two places at once.
      </p>

      <details class="deep">
        <summary>Why the solver still knows best even here</summary>
        <p>
          The five heuristics above are educated guesses — they summarise what strong positions look
          like, not what guarantees them. The solver bypasses all of that: it evaluates the
          full game tree from the current position and returns the exact score of every column.
          When it says column 4 scores +15 and column 1 scores +7, it has literally counted every
          descendant position and confirmed that column 4 leads to a win 15 half-moves faster.
          The heuristics are a shortcut for humans; the solver has no need of them.
        </p>
      </details>
    </section>

    <!-- 6 ───────────────────────────────────────────────── -->
    <section id="rules">
      <h2>6 · Claiming squares — the nine rules</h2>
      <p>
        VICTOR’s rules are all answers to one question:
        <em
          >which squares is the controller guaranteed to get, and which threats does that kill?</em
        >
        You don’t need to memorise them — just recognise the shapes. Here are the ones that do the
        work.
      </p>

      <h3>Claimeven — the backbone</h3>
      <p>
        Two empty squares stacked in a column, the upper one even. If the opponent ever takes the
        lower (odd) square, you immediately take the even one on top. So every even square is yours
        for the asking, and every threat passing through it dies. Almost every defensive plan is
        mostly claimevens.
      </p>
      <details class="deep">
        <summary>Allis’s formal rule</summary>
        <p>
          <strong>Required:</strong> two empty squares directly above each other; the upper square
          is even.<br /><strong>Solves:</strong> all groups containing the upper square.
        </p>
      </details>

      <h3>The rest of the family</h3>
      <ul class="points">
        <li>
          <strong>Baseinverse</strong> — two squares both playable right now. The opponent can only
          take one this turn, so you get the other; any four needing <em>both</em> is dead.
        </li>
        <li>
          <strong>Vertical</strong> — like a claimeven but for an odd upper square: you still get
          one of the two stacked squares.
        </li>
        <li>
          <strong>Lowinverse / Highinverse</strong> — two columns combined so the odd squares are
          split in your favour.
        </li>
        <li>
          <strong>Aftereven</strong> — a line of your own that you can complete using only even
          squares; it then also wipes out every threat sitting above those columns.
        </li>
        <li><strong>Baseclaim</strong> — a claim plus an inverse anchored on the bottom row.</li>
        <li>
          <strong>Before</strong> — answer above a not-quite-finished line so you complete
          <em>before</em> the opponent can.
        </li>
      </ul>
      <p>
        Watch several of them cooperate in one defence — a lowinverse, a vertical, three “before”
        groups and five claimevens, all consistent with each other:
      </p>
      <PairingMiniBoard
        class="diagram"
        :example="ex('draw-inverse')"
        caption="A mixed defence: lowinverse + vertical + before ×3 + claimeven ×5."
      />
    </section>

    <!-- 7 ───────────────────────────────────────────────── -->
    <section id="proof">
      <h2>7 · Putting it together — the pairing proof</h2>
      <p>
        One rule alone proves nothing. The magic is in <strong>combining</strong> them: if the
        controller can pick a set of rules that (a) between them refute <em>every single one</em> of
        the opponent’s possible fours, and (b) never fight over the same square, then the opponent
        can never connect four — so the controller draws at worst. That set of rules <em>is</em> the
        pairing.
      </p>
      <p>
        The hard part is condition (b), consistency. Some rules quietly sabotage each other — Allis
        worked out a full table of which combinations are legal. This site implements that table
        exactly, and then checks every proof it produces against the perfect solver: across tens of
        thousands of positions,
        <strong>it has never once claimed a draw or win the solver disagreed with</strong>. When you
        reveal a plan, it is sound.
      </p>
      <PairingMiniBoard
        class="diagram"
        :example="ex('draw-baseclaim')"
        caption="Baseclaim + aftereven ×3 + baseinverse cover every threat — a proven hold."
      />
      <PairingMiniBoard
        class="diagram"
        :example="ex('draw-before')"
        caption="Sometimes a single ‘before’ plus claimevens is enough."
      />
    </section>

    <!-- 8 ───────────────────────────────────────────────── -->
    <section id="winning">
      <h2>8 · Forcing a win</h2>
      <p>
        Holding the draw is the defender’s art. Winning needs one extra ingredient — a threat the
        opponent can never answer.
      </p>

      <h3>First player: an odd threat</h3>
      <p>
        Give the first player a standing <strong>odd threat</strong> and the zugzwang does the rest:
        the opponent is eventually forced to play just below it, handing over the winning square.
        Everything else on the board is just defence (the very same pairing rules) so the opponent
        can’t win first. The gold star marks the threat the whole win hangs on:
      </p>
      <PairingMiniBoard
        class="diagram"
        :example="ex('win-odd-baseinverse')"
        caption="An odd threat at d3 forces the win; baseinverse + six claimevens hold the rest."
      />

      <h3>Second player: an aftereven</h3>
      <p>
        The second player wins the mirror way. If their defensive plan contains an
        <strong>aftereven</strong>
        — a line of four they complete using only guaranteed even squares — then while refuting
        everything the first player tries, they quietly finish their own four. The stars show the
        even squares they’re guaranteed:
      </p>
      <PairingMiniBoard
        class="diagram"
        :example="ex('win-black-aftereven')"
        caption="The even squares b2–e2 are the second player’s; completing them wins outright."
      />
    </section>

    <!-- 9 ───────────────────────────────────────────────── -->
    <section id="gm">
      <h2>9 · Playing like a champion</h2>
      <p>A practical checklist you can actually use over the board:</p>
      <ol class="steps">
        <li>
          <strong>Open in the centre.</strong> The whole first-player win is built on the middle
          column — it touches the most fours.
        </li>
        <li>
          <strong>Count odd against even.</strong> As first player, hunt for odd threats; as second
          player, for even ones. Whoever has the right kind of threat in a spare column controls the
          endgame.
        </li>
        <li>
          <strong>On defence, take the even squares.</strong> Answer above the opponent’s pieces;
          you are claiming the even square for free every time.
        </li>
        <li>
          <strong>Think in lines, not moves.</strong> Ask “which fours can my opponent still make,
          and do I have an answer to each?” — that question <em>is</em> the pairing.
        </li>
        <li>
          <strong>Practise with the plan.</strong> Open the board, switch to Learn mode, and use
          “Reveal the plan” until you can predict it yourself.
        </li>
      </ol>
      <p class="cta">
        <BaseButton to="/" variant="accent">Open the board and start practising →</BaseButton>
      </p>
    </section>

    <footer class="end">
      <p class="dim">
        The theory here is Victor Allis’s
        <em>A Knowledge-based Approach of Connect-Four</em> (1988); the perfect solver is Pascal
        Pons’s. Every pairing on this page is generated live and validated against that solver.
      </p>
    </footer>
  </article>
</template>

<script setup>
import {useI18n} from 'vue-i18n';
import {EXAMPLES} from '@/learn/examples';
import PairingMiniBoard from '@/components/guide/PairingMiniBoard.vue';
import BaseButton from '@/components/BaseButton.vue';

const {t} = useI18n();
const ex = id => EXAMPLES.find(e => e.id === id);

useSeoMeta({
  title: () => t('guide.seo.title'),
  description: () => t('guide.seo.description'),
  ogTitle: () => t('guide.seo.title'),
  ogDescription: () => t('guide.seo.description'),
  ogType: 'article',
  twitterCard: 'summary',
});
</script>

<style scoped>
.guide {
  container-type: inline-size;
  max-inline-size: 52rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block: clamp(1.5rem, 5vw, 3.5rem);
  line-height: 1.65;
}

.hero {
  margin-block-end: clamp(2rem, 6vw, 3.5rem);
}

.kicker {
  margin: 0;
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin-block: 0.4rem 0.75rem;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  line-height: 1.15;
}

.sub {
  margin: 0;
  color: var(--color-text-dim);
  font-size: clamp(1rem, 2.2vw, 1.2rem);
}

.toc {
  display: flex;
  flex-wrap: wrap;
  margin-block-start: 1.5rem;
  padding-block-start: 1.25rem;
  gap: 0.5rem 1rem;
  border-block-start: 1px solid var(--color-border);

  & a {
    color: var(--color-text-dim);
    font-size: 0.9rem;
    text-decoration: none;
    transition: color 160ms ease;
  }

  & a:hover {
    color: var(--color-accent);
  }
}

section {
  margin-block-end: clamp(2.5rem, 7vw, 4rem);
  scroll-margin-block-start: 1.5rem;
}

h2 {
  margin-block: 0 1rem;
  font-size: clamp(1.4rem, 3.5vw, 2rem);
  line-height: 1.2;
}

h3 {
  margin-block: 1.75rem 0.5rem;
  color: var(--color-accent);
  font-size: clamp(1.1rem, 2.4vw, 1.35rem);
}

p {
  margin-block: 0 1rem;
}

.points,
.steps {
  margin-block: 0 1rem;
  padding-inline-start: 1.25rem;

  & li {
    margin-block: 0.4rem;
  }
}

.deep {
  margin-block: 0.75rem 1.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);

  & summary {
    color: var(--color-accent);
    font-weight: 600;
    cursor: pointer;
  }

  & p {
    margin-block-start: 0.75rem;
  }

  &[open] summary {
    margin-block-end: 0.25rem;
  }
}

/* The interactive diagrams get room and a calm frame. */
.diagram {
  margin-block: 1.5rem;
  padding: clamp(0.75rem, 2vw, 1.25rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
}

.cta {
  margin-block-start: 1.5rem;
}


.end {
  margin-block-start: 3rem;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid var(--color-border);
}

.dim {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}
</style>
