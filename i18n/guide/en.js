/*
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
 * The /guide essay, English. One file per language, all markup-free except the
 * inline emphasis the prose itself needs, so translating the guide means
 * translating prose and never touching the template (app/pages/guide.vue walks
 * this structure).
 *
 * Block types the renderer understands:
 *   {h3} {p} {ul:[…]} {ol:[…]} {details:{summary, body:[…]}}
 *   {diagram:{example, caption}} {legend:[{char, cls, term, desc}]}
 *   {cta:[{to, variant, label}]}
 *
 * `p`, `ul`, `ol` and legend `desc` entries may carry inline <strong>, <em> and
 * <a>. Everything here is authored in this repository, never user input.
 *
 * Terminology note for translators: Allis's eight rule names (Claimeven,
 * Baseinverse, Vertical, Aftereven, Lowinverse, Highinverse, Baseclaim, Before)
 * are coinages from the 1988 thesis and have no published translation in any
 * language. Keep the English name as the identifier so a reader can search for
 * it, and introduce a native gloss in parentheses on first use, the way this
 * file does. The general vocabulary (odd/even threat, zugzwang, ply) does have
 * established native equivalents: use those.
 */

export default {
  seo: {
    title: 'How to Win at Connect 4 — The Complete Guide',
    description:
      'From the bare rules to a solved game: odd and even squares, threats, Allis’s pairing rules, and how to force a win. Every diagram is a real position with a solver-validated plan.',
  },

  kicker: 'The complete guide',
  title: 'How to win at Connect&nbsp;4, from the first move to a solved game',
  sub: 'Connect&nbsp;4 is solved. With perfect play on both sides, the first player wins. This page takes you from the bare rules to reading a board the way the engine does, and every diagram below is a real position whose plan comes from the same proof machine that runs the app.',
  tocLabel: 'Contents',

  toc: [
    {id: 'solved', label: '1 · The game is solved'},
    {id: 'understood', label: '2 · A score is not an explanation'},
    {id: 'parity', label: '3 · Odd and even rows'},
    {id: 'threats', label: '4 · Threats'},
    {id: 'develop', label: '5 · How to develop'},
    {id: 'learn', label: '6 · Reading Learn mode'},
    {id: 'rules', label: '7 · Claiming squares'},
    {id: 'proof', label: '8 · The pairing proof'},
    {id: 'winning', label: '9 · Forcing a win'},
    {id: 'gm', label: '10 · Playing like a champion'},
  ],

  sections: [
    {
      id: 'solved',
      h2: '1 · The game is already solved',
      blocks: [
        {h3: 'The rules, in one paragraph'},
        {
          p: 'Connect&nbsp;4 uses a <strong>7-column by 6-row board</strong>, so 42 slots. Players take turns dropping a disc into a column, and the disc falls to the lowest empty slot there. Line up four of your own discs horizontally, vertically or diagonally and you win. Fill all 42 slots with nobody aligned and the game is drawn.',
        },
        {p: 'Two words turn up on every page written about this game:'},
        {
          ul: [
            '<strong>Square</strong> is the game-theory word for one slot. The holes in a physical board look like circles, but the literature calls them squares, so this page does too.',
            '<strong>Ply</strong> is one disc drop, one turn by one player. A game runs at most 42 plies. Under perfect play the first player completes four on ply&nbsp;41 and leaves a single slot empty.',
          ],
        },
        {
          p: 'A 7×6 board holds exactly <strong>69 four-in-a-row lines</strong>: 24 horizontal, 21 vertical and 24 diagonal. Every idea on this page comes down to a fight over which of those 69 lines each player can still complete.',
        },
        {h3: 'And the fight has a known answer'},
        {
          p: 'In 1988 Victor Allis proved, and James Allen confirmed with an independent program, that on the standard board the <strong>first player can force a win</strong> by opening in the middle column. All 4.5&nbsp;trillion reachable positions carry an exact value.',
        },
        {
          p: 'Pascal&nbsp;Pons wrote the modern version of that result, and it runs on this site. Hand it any position and it answers at once: win, loss or draw, and how many moves that takes. The number above each column is that answer, not an estimate.',
        },
        {
          details: {
            summary: 'The rigorous version: how Pons’s solver works',
            body: [
              'The engine walks the game tree with <strong>negamax and alpha–beta pruning</strong>. It plays out lines, and the moment it finds a reply good enough to refute a move, it drops that whole branch. It stores the board as a <strong>bitboard</strong>, two 64-bit integers with one per player, so testing for four-in-a-row and generating moves take a handful of bit operations. A <strong>transposition table</strong> caches positions it has already evaluated, and an <strong>opening book</strong> holds the value of every position up to a fixed depth, so the early moves need no search.',
              'The score encodes <em>distance to the end</em>. A position worth +N means the winner connects four with N empty squares to spare, so a bigger number means a faster win. Trying centre columns first lets alpha–beta cut enormous parts of the tree, which is why your browser solves a trillion-position game in milliseconds.',
            ],
          },
        },
      ],
    },

    {
      id: 'understood',
      h2: '2 · A score tells you who wins, never why',
      blocks: [
        {
          p: 'A score of +11 tells you the position is won. It says nothing about which squares carry the win, and it will not help you find that win over a physical board on a Sunday afternoon. For that you need a plan small enough to hold in your head.',
        },
        {
          p: 'Allis’s program <strong>VICTOR</strong> builds one. Rather than searching, it reasons about which squares each player is guaranteed to get whatever the opponent does, then assembles those guarantees into a <strong>pairing</strong>: a fixed plan that answers every four the opponent could still make. The rest of this page builds that theory one idea at a time, and the “Reveal the plan” button under each board shows VICTOR’s pairing for that exact position, checked against the perfect solver.',
        },
      ],
    },

    {
      id: 'parity',
      h2: '3 · The secret of the board: odd and even rows',
      blocks: [
        {
          p: 'Number the rows 1 to 6 from the bottom. The first player tends to land on the odd rows (1, 3, 5) and the second player on the even rows (2, 4, 6). That single sentence drives most of Connect&nbsp;4 strategy, and you can convince yourself of it three different ways.',
        },
        {h3: 'First way: fill one column and watch'},
        {
          p: 'Take an empty column and let both players alternate into it. The first player takes row 1, the second takes row 2, the first takes row 3, and so on to the top. Nothing forces both players to keep answering in the same column, so the pattern bends during the middlegame. The count reasserts itself once the board tightens and the spare moves run out.',
        },
        {h3: 'Second way: count who runs out of waiting moves'},
        {
          p: 'Late in a game most columns are poisoned: dropping there hands your opponent a square they want. Both players shuffle into whatever is left, waiting for the other to crack. Chess players call this <em>zugzwang</em>, being forced to move when every move hurts. Counting the empty squares in the live columns tells you who cracks first, and the player who cracks drops a disc directly under their opponent’s winning square.',
        },
        {h3: 'Third way: the even squares as the second player’s territory'},
        {
          p: 'The second player can answer any disc by dropping on top of it in the same column. That answer is always available, and it lands on an even row whenever the opponent’s disc landed on an odd one. Repeat it and the second player collects even squares for free, which kills every line running through them. Reveal the plan on the drawn position below: the second player claims eleven even squares and needs nothing else.',
        },
        {
          diagram: {
            example: 'draw-claimeven',
            caption: 'Second player holds the draw by owning the even squares, and nothing else.',
          },
        },
      ],
    },

    {
      id: 'threats',
      h2: '4 · Threats: the squares that win',
      blocks: [
        {
          p: 'A <strong>threat</strong> is an empty square that would complete a four-in-a-row for you. Parity splits threats into two kinds, and they carry different weight:',
        },
        {
          ul: [
            '<strong>Odd threats</strong> sit on an odd row and belong to the first player’s repertoire. The column holding one keeps an odd number of empty squares below it, so the endgame count hands that square to the first player.',
            '<strong>Even threats</strong> sit on an even row and belong to the second player, who builds their whole defence on even squares anyway.',
          ],
        },
        {h3: 'Why an odd threat beats an even one'},
        {
          p: 'Picture a threat for the first player on row 3 of column&nbsp;b, with the rest of the board locked. Neither player wants to touch column&nbsp;b: whoever plays b2 lets the other take b3. So both sides burn their spare moves elsewhere, and those spare moves run out on the second player’s turn. They play b2, the first player takes b3 and wins. Swap the parity and the same count runs the other way.',
        },
        {
          p: 'Two odd threats cancel, and so do two even ones. A first-player even threat against a second-player odd threat ends in a draw. Counting odd against even covers most of the gap between a beginner and a strong club player.',
        },
      ],
    },

    {
      id: 'develop',
      h2: '5 · How to develop, when no rule fires yet',
      blocks: [
        {
          p: 'Through the first dozen or so plies, no VICTOR rule applies. There are not enough discs on the board for a full pairing proof to exist. The solver still knows the right move, but its reason is positional rather than rule-based, and the app labels that <em>a developing move</em>. Five habits let you pick one yourself.',
        },
        {h3: '1 · Start in the centre'},
        {
          p: 'Column&nbsp;4 belongs to more potential fours than any other: 51 of the board’s 69 lines run through it, being all 24 horizontals, all 24 diagonals and 3 verticals. Columns 3 and 5 come next, then 2 and 6, then the edges. When you have no better idea, a move toward the centre rarely costs you anything.',
        },
        {h3: '2 · Land on your parity row'},
        {
          p: 'Before you drop a disc, work out which row it lands on. Count the discs already in that column: an even count means your disc lands on an odd row, an odd count means an even row. As first player, aim for <strong>odd rows</strong> (1, 3, 5); as second player, aim for <strong>even rows</strong> (2, 4, 6). Landing on the wrong row gifts the endgame count to your opponent.',
        },
        {h3: '3 · Count the lines you open'},
        {
          p: 'After the drop, count how many four-in-a-row lines now hold at least one of your discs and none of your opponent’s. More is better. Learn mode draws this for you with the <em>opportunity</em> markers (your embryonic threats) and the <em>danger</em> markers (your opponent’s). A developing move that opens three new lines beats one that opens a single line, all else equal.',
        },
        {h3: '4 · Watch what you hand over'},
        {
          p: 'Every disc you place is an invitation, because your opponent’s next disc can land directly on top of it. Check that square before you commit. If it gives them an even square they wanted or opens a line they lacked, look for another column.',
        },
        {h3: '5 · Spread your threats across columns'},
        {
          p: 'Two of your own threats stacked in one column cancel each other, since the opponent blocks once and kills both. Spread them out. The positions worth aiming for are the ones where your opponent would need to be in two columns at once.',
        },
        {
          details: {
            summary: 'Why the solver still knows better than these five habits',
            body: [
              'The habits above are educated guesses. They describe what strong positions tend to look like, and they guarantee nothing. The solver skips all of it: it evaluates the full game tree from the position in front of you and returns the exact score of every column. When it says column&nbsp;4 scores +15 and column&nbsp;1 scores +7, it has counted every descendant position of both and confirmed that column&nbsp;4 wins 8 plies sooner. The heuristics are a shortcut for humans, and the engine has no use for them.',
            ],
          },
        },
      ],
    },

    {
      id: 'learn',
      h2: '6 · Reading Learn mode',
      blocks: [
        {
          p: 'Learn mode answers you with two separate machines, and telling them apart makes the hints much easier to trust.',
        },
        {
          p: 'Practice mode (<a href="/practice">the exercises</a>) deals you a position built around one of these ideas and grades the column you pick, which is the fastest way to find out whether you are reading the markers the way the engine does.',
        },
        {
          ul: [
            '<strong>The solver chooses the column.</strong> It re-reads the whole board every move, so it stays correct after a blunder by either side, and in positions no theory book covers.',
            '<strong>A rule layer describes that choice in words</strong> and draws the markers. It works from the threat structure sitting on the board, not from the search.',
          ],
        },
        {
          p: 'The solver never asks the rule layer for permission. When a hint sounds mild and the score bar says the position is winning, believe the score.',
        },
        {h3: 'How the card picks its word'},
        {
          p: 'The card names <em>the move the solver recommends</em>, never the move you played last. It runs these tests in order against that recommended column and stops at the first one that fires:',
        },
        {
          ol: [
            '<strong>A winning move.</strong> Dropping there completes four for you right now.',
            '<strong>A block.</strong> Dropping there completes four for your opponent, so you take the square before they do.',
            '<strong>An odd or even threat.</strong> After the drop you hold at least one threat square you did not hold before. The card names the parity that helps you, odd for the first player and even for the second, and falls back to whichever threat appeared when the move creates only the other kind.',
            '<strong>A claimeven.</strong> No new threat appeared, and the square sits on an even row directly above an opponent disc. Only the second player sees this label, since even squares are the second player’s tool.',
            '<strong>A developing move.</strong> None of the tests above fired.',
          ],
        },
        {
          p: 'Because the tests run in order, a move that blocks a four <em>and</em> builds an odd threat reads as a block. The card gives you the most urgent reason for the move, and the board markers carry the rest of the story.',
        },
        {
          p: 'A developing move is a strong move whose reason has no name yet. Most of the first ten plies are developing moves, and the solver knows which of them wins.',
        },
        {h3: 'The markers on the board'},
        {
          p: 'Press “Show me on the board” and the squares pick up glyphs. The steady-state diagram in the sidebar uses the same vocabulary at small size.',
        },
        {
          legend: [
            {
              char: '✦',
              cls: 'g-win',
              term: 'Gold star',
              desc: 'The game turns on this square: either you complete four here, or your opponent would have completed four here next turn.',
            },
            {
              char: '◎',
              cls: 'g-play',
              term: 'Double ring',
              desc: 'The recommended landing square. When several columns tie on score, each of them gets one, and any of them is fine.',
            },
            {
              char: '○',
              cls: 'g-opp',
              term: 'Thin ring',
              desc: 'One of your threats: an empty square that completes a four for you if you ever get to drop there.',
            },
            {
              char: '✕',
              cls: 'g-danger',
              term: 'Red cross',
              desc: 'One of your opponent’s threats, with no rule of yours answering it yet. Two of these in columns you cannot both cover is how games get lost.',
            },
            {
              char: '◌',
              cls: 'g-ctrl',
              term: 'Dashed ring',
              desc: 'An opponent threat that a rule already answers, so it needs no move from you today. It is drawn calm on purpose.',
            },
          ],
        },
        {
          p: 'Whole lines get outlined too, not only the single completing square, so you can see the four a marker belongs to. When one square sits on lines belonging to both players, the danger colouring wins the tie.',
        },
        {h3: 'Where a dashed ring comes from'},
        {p: 'Two rules produce that calm marker, and both are worth recognising over a real board:'},
        {
          ul: [
            '<strong>Claimeven control.</strong> The opponent’s threat sits on an even square the second player collects by answering on top. The threat exists, and it will never be theirs.',
            '<strong>A baseinverse fork.</strong> The opponent has two discs in a four whose remaining two squares are both playable this turn, and those two squares always sit in different columns. They take one, you take the other, so the four dies whichever way they go.',
          ],
        },
        {h3: 'Reveal the plan'},
        {
          p: 'The plan button appears once the prover finds a complete proof for the position. The headline states who can force what: a win for the first player, a win for the second, or a hold for the second player. Under it, one line names the <strong>anchor</strong>, the thing that does the forcing:',
        },
        {
          ul: [
            'An <strong>odd threat</strong> at a named square, which turns the zugzwang into a win.',
            'An <strong>immediate</strong> four available right now in a named column.',
            'An <strong>aftereven</strong>, a line the second player completes using only even squares they are guaranteed.',
            'A <strong>threat combination</strong>, where two squares between them force an odd threat whichever way the opponent replies.',
          ],
        },
        {
          p: 'Below the anchor comes the rule list, one row per rule with the number of times the plan uses it. Each rule owns a glyph and a colour, and the squares that rule reserves carry the same glyph on the board, so you can trace any line of the list to the part of the board it governs:',
        },
        {
          legend: [
            {char: '◆', cls: 'rule-claimeven', term: 'Claimeven', desc: 'Take the even square above theirs.'},
            {char: '■', cls: 'rule-baseinverse', term: 'Baseinverse', desc: 'Two playable squares, and they cannot have both.'},
            {char: '▮', cls: 'rule-vertical', term: 'Vertical', desc: 'Answer on top to deny the column.'},
            {char: '▲', cls: 'rule-aftereven', term: 'Aftereven', desc: 'Even squares kill the threats above them.'},
            {char: '▽', cls: 'rule-lowinverse', term: 'Lowinverse', desc: 'Two odd squares, and you get one. The arrow points down for low.'},
            {char: '△', cls: 'rule-highinverse', term: 'Highinverse', desc: 'Control three-high across two columns. The arrow points up for high.'},
            {char: '◈', cls: 'rule-baseclaim', term: 'Baseclaim', desc: 'A claim plus an inverse, anchored on the bottom row.'},
            {char: '●', cls: 'rule-before', term: 'Before', desc: 'Answer above, so that you complete your four first.'},
          ],
        },
        {
          p: 'The last line counts what the plan covers: the opponent’s potential fours, all of them, with no two rules fighting over the same square. Drop either half of that condition and the proof collapses, which is why the count is worth reading.',
        },
        {
          p: 'No plan button means the prover found no proof for this position, so it says nothing. It never guesses, and it never claims a hold the solver disagrees with. The score bar and the word hint keep working regardless.',
        },
      ],
    },

    {
      id: 'rules',
      h2: '7 · Claiming squares: the rules behind the plan',
      blocks: [
        {
          p: 'Every VICTOR rule answers one question: <em>which squares am I guaranteed to get, and which of the opponent’s fours does that kill?</em> Memorising them is unnecessary. Recognising the shapes is the useful part.',
        },
        {h3: 'Claimeven, the backbone'},
        {
          p: 'Two empty squares stacked in a column, with the upper one on an even row. Should the opponent take the lower square, you take the even one on top at once. So the even square is yours for the asking, and any four running through it dies. Most defensive plans are claimevens with a few exceptions bolted on.',
        },
        {
          details: {
            summary: 'Allis’s formal rule',
            body: [
              '<strong>Required:</strong> two empty squares directly above each other, with the upper square on an even row.<br /><strong>Solves:</strong> all groups containing the upper square.',
            ],
          },
        },
        {h3: 'The rest of the family'},
        {
          ul: [
            '<strong>Baseinverse</strong>: two squares both playable this turn. Your opponent takes one at most, so you take the other, and any four needing <em>both</em> is dead.',
            '<strong>Vertical</strong>: the same stacked pair as a claimeven, with the upper square on an odd row. You still end up with one of the two.',
            '<strong>Lowinverse and highinverse</strong>: two columns combined so the odd squares split in your favour.',
            '<strong>Aftereven</strong>: a line of your own that you complete using even squares alone. It also wipes out every threat sitting above those columns.',
            '<strong>Baseclaim</strong>: a claim plus an inverse, anchored on the bottom row.',
            '<strong>Before</strong>: you answer above an unfinished line so that you complete yours first.',
          ],
        },
        {
          p: 'Watch several of them cooperate in one defence, with a lowinverse, a vertical, three “before” groups and five claimevens all consistent with each other:',
        },
        {
          diagram: {
            example: 'draw-inverse',
            caption: 'A mixed defence: lowinverse + vertical + before ×3 + claimeven ×5.',
          },
        },
      ],
    },

    {
      id: 'proof',
      h2: '8 · Putting it together: the pairing proof',
      blocks: [
        {
          p: 'One rule on its own proves nothing. The strength comes from <strong>combining</strong> them. Pick a set of rules that between them refute every single four the opponent could still build, and that never claim the same square twice, and your opponent can never connect four. You hold the draw at worst. That set of rules <em>is</em> the pairing.',
        },
        {
          p: 'The second condition, consistency, causes the trouble. Some rules sabotage each other, and Allis worked out a full table of which combinations survive together. This site implements that table and then checks every proof it produces against the perfect solver. Across tens of thousands of positions it has yet to claim a draw or a win the solver disagreed with. A plan you reveal is sound.',
        },
        {
          diagram: {
            example: 'draw-baseclaim',
            caption: 'Baseclaim + aftereven ×3 + baseinverse cover every threat: a proven hold.',
          },
        },
        {
          diagram: {
            example: 'draw-before',
            caption: 'Sometimes a single ‘before’ plus claimevens is enough.',
          },
        },
      ],
    },

    {
      id: 'winning',
      h2: '9 · Forcing a win',
      blocks: [
        {
          p: 'Holding a draw is the defender’s craft. A win needs one extra ingredient: a threat your opponent can never answer.',
        },
        {h3: 'First player: an odd threat'},
        {
          p: 'Give the first player a standing <strong>odd threat</strong> and the zugzwang finishes the job. The opponent runs out of safe moves, plays under the threat and hands over the winning square. The rest of the board is pure defence, using the same pairing rules, so the opponent never gets there first. The gold star marks the threat the whole win rests on:',
        },
        {
          diagram: {
            example: 'win-odd-baseinverse',
            caption: 'An odd threat at d3 forces the win; baseinverse + six claimevens hold the rest.',
          },
        },
        {h3: 'Second player: an aftereven'},
        {
          p: 'The second player wins by mirroring that idea. When their defensive plan contains an <strong>aftereven</strong>, a line of four they complete on guaranteed even squares, they answer everything the first player tries and finish their own four along the way. The stars show the even squares they are guaranteed:',
        },
        {
          diagram: {
            example: 'win-black-aftereven',
            caption: 'The even squares b2–e2 are the second player’s; completing them wins outright.',
          },
        },
      ],
    },

    {
      id: 'gm',
      h2: '10 · Playing like a champion',
      blocks: [
        {p: 'A checklist you can carry to a real board:'},
        {
          ol: [
            '<strong>Open in the centre.</strong> The entire first-player win is built on the middle column, which touches the most fours.',
            '<strong>Count odd against even.</strong> As first player, hunt odd threats; as second player, even ones. Whoever holds the right kind of threat in a spare column owns the endgame.',
            '<strong>On defence, take the even squares.</strong> Answering on top of your opponent’s disc claims an even square at no cost.',
            '<strong>Think in lines rather than moves.</strong> Ask which fours your opponent can still make and whether you hold an answer to each. That question <em>is</em> the pairing.',
            '<strong>Practise with the plan open.</strong> Switch to Learn mode and use “Reveal the plan” until you can predict what it will say before you press it.',
            '<strong>Then practise without it.</strong> The exercises deal you a position, take your answer, and tell you what the solver saw that you did not.',
          ],
        },
        {
          cta: [
            {to: '/practice', variant: 'accent', label: 'Start the exercises →'},
            {to: '/', variant: 'default', label: 'Open the board'},
          ],
        },
      ],
    },
  ],

  footer:
    'The theory here comes from Victor Allis’s <em>A Knowledge-based Approach of Connect-Four</em> (1988), and the perfect solver from Pascal Pons. Every pairing on this page is generated live and validated against that solver.',
};
