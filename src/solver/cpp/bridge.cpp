/*
 * WASM bridge for Pascal Pons' Connect 4 Solver.
 * Exposes analyze() and solve() to JavaScript via Emscripten.
 *
 * Original solver: http://connect4.gamesolver.org
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 * Licensed under AGPL-3.0
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
