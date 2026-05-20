export type DPState = {
  rows: string;        // y-axis label characters
  cols: string;        // x-axis label characters
  table: (number | null)[][];
  current?: [number, number];
  pulled?: [number, number][];   // cells consulted to compute current
  path?: [number, number][];     // final reconstruction
  note?: string;
  line?: number;
};

export type DPAlgo = (input: { a: string; b: string }) => Generator<DPState, void, void>;

export const lcsCode = `function* lcs(a, b) {
  const dp = grid(a.length + 1, b.length + 1, 0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  // backtrack from dp[m][n]
  return reconstruct(dp, a, b);
}`;

export const lcs: DPAlgo = function* ({ a, b }) {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  const snap = (current: [number, number] | undefined, pulled: [number, number][], line: number, note: string): DPState => ({
    rows: ' ' + a, cols: ' ' + b,
    table: dp.map((row) => row.map((v) => v)),
    current, pulled, line, note,
  });

  yield snap(undefined, [], 1, 'init zeros along borders');

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
        yield snap([i, j], [[i - 1, j - 1]], 5, `a[${i - 1}] = b[${j - 1}] = '${a[i - 1]}', extend by 1`);
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
        yield snap([i, j], [[i - 1, j], [i, j - 1]], 6, `mismatch, take max(${dp[i - 1]![j]}, ${dp[i]![j - 1]})`);
      }
    }
  }

  // Reconstruction
  const path: [number, number][] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    path.push([i, j]);
    if (a[i - 1] === b[j - 1]) { i--; j--; }
    else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--;
    else j--;
  }
  yield {
    rows: ' ' + a, cols: ' ' + b,
    table: dp,
    path: path.reverse(),
    line: 11, note: `LCS length = ${dp[m]![n]}`,
  };
};

export const editCode = `function* editDistance(a, b) {
  const dp = grid(a.length + 1, b.length + 1);
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1];
      else dp[i][j] = 1 + min(
        dp[i-1][j],     // delete
        dp[i][j-1],     // insert
        dp[i-1][j-1],   // substitute
      );
    }
  }
}`;

export const edit: DPAlgo = function* ({ a, b }) {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  const snap = (current: [number, number] | undefined, pulled: [number, number][], line: number, note: string): DPState => ({
    rows: ' ' + a, cols: ' ' + b,
    table: dp.map((row) => row.map((v) => v)),
    current, pulled, line, note,
  });

  yield snap(undefined, [], 3, 'fill base row + column');

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
        yield snap([i, j], [[i - 1, j - 1]], 7, `match '${a[i - 1]}'`);
      } else {
        dp[i]![j] = 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
        yield snap([i, j], [[i - 1, j], [i, j - 1], [i - 1, j - 1]], 9, `min(del, ins, sub) + 1`);
      }
    }
  }

  // Reconstruct edit script
  const path: [number, number][] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    path.push([i, j]);
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { i--; j--; }
    else {
      const best = Math.min(
        i > 0 ? dp[i - 1]![j]! : Infinity,
        j > 0 ? dp[i]![j - 1]! : Infinity,
        i > 0 && j > 0 ? dp[i - 1]![j - 1]! : Infinity,
      );
      if (i > 0 && dp[i - 1]![j] === best) i--;
      else if (j > 0 && dp[i]![j - 1] === best) j--;
      else { i--; j--; }
    }
  }
  yield {
    rows: ' ' + a, cols: ' ' + b,
    table: dp,
    path: path.reverse(),
    line: 14, note: `distance = ${dp[m]![n]}`,
  };
};

export type DPKey = 'lcs' | 'edit';

export const DPS: Record<DPKey, { name: string; algo: DPAlgo; code: string; problem: string }> = {
  lcs: { name: 'Longest common subsequence', algo: lcs, code: lcsCode, problem: 'longest characters shared in order' },
  edit: { name: 'Edit distance', algo: edit, code: editCode, problem: 'min insert/delete/substitute to transform' },
};
