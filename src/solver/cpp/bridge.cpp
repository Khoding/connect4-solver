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
 
#include <emscripten/emscripten.h>
#include <cstring>
#include <string>
#include "Solver.hpp"
#include "Position.hpp"

using namespace GameSolver::Connect4;

static Solver solver;
static bool book_loaded = false;

// Shared buffer for returning 7 scores to JS
static int scores_buffer[7];

extern "C" {

/**
 * Load the opening book from a file path in Emscripten's virtual filesystem.
 * Returns 1 on success, 0 on failure.
 */
EMSCRIPTEN_KEEPALIVE
int load_book(const char* path) {
  solver.loadBook(std::string(path));
  book_loaded = true;
  return 1;
}

/**
 * Analyze a position: compute the score of each possible move.
 * @param moves: string of digits 1-7 representing the move sequence
 * @return pointer to a static int[7] buffer with scores.
 *         Score > 0: current player wins in that many moves
 *         Score < 0: current player loses
 *         Score == 0: draw
 *         Score == -1000: column not playable (full or invalid)
 */
EMSCRIPTEN_KEEPALIVE
int* analyze(const char* moves) {
  solver.reset();

  Position P;
  std::string seq(moves);

  if (P.play(seq) != seq.size()) {
    // Invalid position — return all -1000
    for (int i = 0; i < 7; i++) scores_buffer[i] = -1000;
    return scores_buffer;
  }

  std::vector<int> result = solver.analyze(P, false); // strong solve
  for (int i = 0; i < 7; i++) {
    scores_buffer[i] = result[i];
  }
  return scores_buffer;
}

/**
 * Solve a single position: compute the score for the current player.
 * @param moves: string of digits 1-7 representing the move sequence
 * @param weak: if 1, only determine win/draw/loss (faster)
 * @return the score (+: win, -: loss, 0: draw), or -1000 on invalid input
 */
EMSCRIPTEN_KEEPALIVE
int solve(const char* moves, int weak) {
  solver.reset();

  Position P;
  std::string seq(moves);

  if (P.play(seq) != seq.size()) {
    return -1000; // invalid position
  }

  return solver.solve(P, weak != 0);
}

/**
 * Get the number of nodes explored in the last computation.
 */
EMSCRIPTEN_KEEPALIVE
unsigned long long get_node_count() {
  return solver.getNodeCount();
}

} // extern "C"
