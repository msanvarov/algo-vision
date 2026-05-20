export type NQueensState = {
  n: number;
  board: number[];   // board[row] = column of queen in that row, -1 = none
  trying?: { row: number; col: number };
  attacked: Set<string>;
  conflict?: { row: number; col: number; with: { row: number; col: number } };
  solutions: number;
  attempts: number;
  backtracks: number;
  done: boolean;
  note?: string;
  line?: number;
};

export const nqueensCode = `function* solveNQueens(n) {
  const board = new Array(n).fill(-1);
  let solutions = 0;

  function* place(row) {
    if (row === n) { solutions++; yield 'solved'; return; }
    for (let col = 0; col < n; col++) {
      if (safe(board, row, col)) {
        board[row] = col;
        yield* place(row + 1);
        board[row] = -1;       // backtrack
      }
    }
  }
  yield* place(0);
}`;

function safe(board: number[], row: number, col: number): { ok: boolean; conflict?: { row: number; col: number } } {
  for (let r = 0; r < row; r++) {
    const c = board[r]!;
    if (c === col) return { ok: false, conflict: { row: r, col: c } };
    if (Math.abs(c - col) === row - r) return { ok: false, conflict: { row: r, col: c } };
  }
  return { ok: true };
}

function attacked(board: number[], row: number): Set<string> {
  const set = new Set<string>();
  for (let r = 0; r < row; r++) {
    const c = board[r]!;
    if (c < 0) continue;
    for (let i = 0; i < board.length; i++) {
      set.add(`${r},${i}`);
      set.add(`${i},${c}`);
      // diagonals
      const d = i - r;
      if (c + d >= 0 && c + d < board.length) set.add(`${i},${c + d}`);
      if (c - d >= 0 && c - d < board.length) set.add(`${i},${c - d}`);
    }
  }
  return set;
}

export function* nqueens(n: number): Generator<NQueensState, void, void> {
  const board: number[] = Array(n).fill(-1);
  let solutions = 0;
  let attempts = 0;
  let backtracks = 0;

  const snap = (extra: Partial<NQueensState>): NQueensState => ({
    n, board: [...board],
    attacked: attacked(board, board.findIndex((c) => c < 0) === -1 ? n : board.findIndex((c) => c < 0)),
    solutions, attempts, backtracks,
    done: false,
    ...extra,
  });

  function* place(row: number): Generator<NQueensState, void, void> {
    if (row === n) {
      solutions++;
      yield snap({ note: `solution ${solutions}`, line: 4 });
      return;
    }
    for (let col = 0; col < n; col++) {
      attempts++;
      const check = safe(board, row, col);
      yield snap({ trying: { row, col }, line: 7, note: `try (${row}, ${col})` });
      if (check.ok) {
        board[row] = col;
        yield snap({ line: 9, note: 'place queen' });
        yield* place(row + 1);
        board[row] = -1;
        backtracks++;
        yield snap({ line: 11, note: `backtrack from row ${row}` });
      } else if (check.conflict) {
        yield snap({
          trying: { row, col },
          conflict: { row, col, with: check.conflict },
          line: 8,
          note: `attacked by queen at (${check.conflict.row}, ${check.conflict.col})`,
        });
      }
    }
  }

  yield snap({ note: 'start', line: 1 });
  yield* place(0);
  yield snap({ done: true, note: `complete — ${solutions} solution(s)`, line: 13 });
}
