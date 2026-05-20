import type { SortAlgo, SortState } from './types';

export const quickCode = `function* quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return;
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    // compare against pivot
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  yield* quickSort(arr, lo, i);
  yield* quickSort(arr, i + 2, hi);
}`;

export const quick: SortAlgo = function* (input) {
  const arr = [...input];
  const sorted = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const snap = (extra: Partial<SortState> & { line?: number; note?: string }) => ({
    array: [...arr],
    comparing: extra.comparing ?? [],
    swapping: extra.swapping ?? [],
    pivot: extra.pivot,
    sorted: new Set(sorted),
    comparisons,
    swaps,
    line: extra.line,
    note: extra.note,
  });

  function* partition(lo: number, hi: number): Generator<ReturnType<typeof snap>, number, void> {
    const pivot = arr[hi]!;
    yield snap({ pivot: hi, line: 3, note: `pivot = ${pivot}` });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      yield snap({ comparing: [j, hi], pivot: hi, line: 7, note: `compare ${arr[j]} vs pivot ${pivot}` });
      if (arr[j]! <= pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j]!, arr[i]!];
          swaps++;
          yield snap({ swapping: [i, j], pivot: hi, line: 9, note: 'swap into low partition' });
        }
      }
    }
    [arr[i + 1], arr[hi]] = [arr[hi]!, arr[i + 1]!];
    swaps++;
    yield snap({ swapping: [i + 1, hi], pivot: i + 1, line: 13, note: 'place pivot' });
    sorted.add(i + 1);
    return i + 1;
  }

  function* qs(lo: number, hi: number): Generator<ReturnType<typeof snap>, void, void> {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo);
      return;
    }
    const p = yield* partition(lo, hi);
    yield* qs(lo, p - 1);
    yield* qs(p + 1, hi);
  }

  yield snap({ line: 1, note: 'start' });
  yield* qs(0, arr.length - 1);
  for (let k = 0; k < arr.length; k++) sorted.add(k);
  yield snap({ note: 'sorted' });
};
