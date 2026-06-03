/*
 * Copyright (C) Pascal Pons (https://github.com/PascalPons/connect4)
 * Copyright (C) 2026 Khodok
 * 
 * This file is part of Connect4 Game Solver.
 */

#include "Position.hpp"
#include "Solver.hpp"
#include "OpeningBook.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <unordered_set>
#include <cstdlib>

using namespace GameSolver::Connect4;

std::unordered_set<uint64_t> visited;

#ifndef DEPTH
#define DEPTH 8
#endif

// Choose transposition table size based on depth to manage memory and file size.
// OpeningBook.hpp supports log_size from 21 to 27.
#if DEPTH <= 6
#define BOOK_SIZE 21
#elif DEPTH <= 8
#define BOOK_SIZE 22
#else
#define BOOK_SIZE 23
#endif

static constexpr double LOG_3 = 1.58496250072;
using partial_key_t = uint_t<int((DEPTH + Position::WIDTH - 1) * LOG_3) + 1 - BOOK_SIZE>;
TranspositionTable<partial_key_t, Position::position_t, uint8_t, BOOK_SIZE> *table = nullptr;
Solver solver;

void explore_and_solve(const Position &P) {
  uint64_t key = P.key3();
  if(!visited.insert(key).second)
    return; // Already explored position

  int nb_moves = P.nbMoves();
  
  // Solve and store in transposition table
  int score = solver.solve(P, false); // Strong solve
  table->put(key, score - Position::MIN_SCORE + 1);

  if(nb_moves >= DEPTH) return;  // Do not explore further

  for(int i = 0; i < Position::WIDTH; i++) { // Explore all possible moves
    if(P.canPlay(i) && !P.isWinningMove(i)) {
      Position P2(P);
      P2.playCol(i);
      explore_and_solve(P2);
    }
  }
}

int main() {
  std::cerr << "Generating opening book for board " << Position::WIDTH << "x" << Position::HEIGHT 
            << " up to depth " << DEPTH << " (BOOK_SIZE = " << BOOK_SIZE << ")..." << std::endl;

  table = new TranspositionTable<partial_key_t, Position::position_t, uint8_t, BOOK_SIZE>();

  explore_and_solve(Position());

  std::cerr << "Explored " << visited.size() << " unique positions." << std::endl;

  OpeningBook book{Position::WIDTH, Position::HEIGHT, DEPTH, table};

  std::ostringstream book_file;
  book_file << "public/wasm/" << Position::WIDTH << "x" << Position::HEIGHT << ".book";
  book.save(book_file.str());
  std::cerr << "Saved opening book to " << book_file.str() << std::endl;

  return 0;
}
