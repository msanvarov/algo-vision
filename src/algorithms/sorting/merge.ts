import type { SortAlgo, SortState } from './types';

export const mergeCode = `function* mergeSort(arr, lo = 0, hi = arr.length) {
  if (hi - lo <= 1) return;
  const mid = (lo + hi) >> 1;
  yield* mergeSort(arr, lo, mid);
  yield* mergeSort(arr, mid, hi);
  // merge two sorted halves in place via aux buffer
  const left = arr.slice(lo, mid);
  const right = arr.slice(mid, hi);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    arr[k++] = left[i] <= right[j] ? left[i++] : right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`;

export const merge: SortAlgo = function* (input) {
  const arr = [...input];
  const sorted = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const snap = (extra: Partial<SortState> & { line?: number; note?: string }) => ({
    array: [...arr],
    comparing: extra.comparing ?? [],
    swapping: extra.swapping ?? [],
    sorted: new Set(sorted),
    comparisons,
    swaps,
    line: extra.line,
    note: extra.note,
  });

  function* ms(lo: number, hi: number): Generator<ReturnType<typeof snap>, void, void> {
    if (hi - lo <= 1) {
      if (hi - lo === 1) sorted.add(lo);
      return;
    }
    const mid = (lo + hi) >> 1;
    yield* ms(lo, mid);
    yield* ms(mid, hi);

    const left = arr.slice(lo, mid);
    const right = arr.slice(mid, hi);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      comparisons++;
      yield snap({ comparing: [lo + i, mid + j], line: 12, note: `merge: compare ${left[i]} vs ${right[j]}` });
      if (left[i]! <= right[j]!) {
        arr[k++] = left[i++]!;
      } else {
        arr[k++] = right[j++]!;
      }
      swaps++;
      yield snap({ swapping: [k - 1], line: 13, note: 'write back' });
    }
    while (i < left.length) {
      arr[k++] = left[i++]!;
      swaps++;
      yield snap({ swapping: [k - 1], line: 16, note: 'drain left' });
    }
    while (j < right.length) {
      arr[k++] = right[j++]!;
      swaps++;
      yield snap({ swapping: [k - 1], line: 17, note: 'drain right' });
    }
    for (let m = lo; m < hi; m++) sorted.add(m);
    yield snap({ line: 14, note: `range [${lo}, ${hi}) merged` });
  }

  yield snap({ line: 1, note: 'start' });
  yield* ms(0, arr.length);
  yield snap({ note: 'sorted' });
};
