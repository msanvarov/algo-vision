import type { SortAlgo, SortState } from './types';

export const heapCode = `function* heapSort(arr) {
  const n = arr.length;
  // build max-heap
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(arr, i, n);
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    siftDown(arr, 0, end);
  }
}

function siftDown(arr, i, n) {
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let best = i;
    if (l < n && arr[l] > arr[best]) best = l;
    if (r < n && arr[r] > arr[best]) best = r;
    if (best === i) return;
    [arr[i], arr[best]] = [arr[best], arr[i]];
    i = best;
  }
}`;

export const heap: SortAlgo = function* (input) {
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

  function* siftDown(i: number, n: number): Generator<ReturnType<typeof snap>, void, void> {
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let best = i;
      if (l < n) {
        comparisons++;
        yield snap({ comparing: [l, best], line: 16 });
        if (arr[l]! > arr[best]!) best = l;
      }
      if (r < n) {
        comparisons++;
        yield snap({ comparing: [r, best], line: 17 });
        if (arr[r]! > arr[best]!) best = r;
      }
      if (best === i) return;
      [arr[i], arr[best]] = [arr[best]!, arr[i]!];
      swaps++;
      yield snap({ swapping: [i, best], line: 19, note: 'sift down' });
      i = best;
    }
  }

  const n = arr.length;
  yield snap({ line: 1, note: 'start' });
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    yield* siftDown(i, n);
  }
  yield snap({ line: 3, note: 'heap built' });

  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end]!, arr[0]!];
    swaps++;
    yield snap({ swapping: [0, end], line: 5, note: 'move max to end' });
    sorted.add(end);
    yield* siftDown(0, end);
  }
  sorted.add(0);
  yield snap({ note: 'sorted' });
};
