import type { SortAlgo } from './types';

export const bubbleCode = `function* bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      // compare adjacent pair
      if (arr[j] > arr[j + 1]) {
        // swap them
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    // tail is in final position
    if (!swapped) break;
  }
}`;

export const bubble: SortAlgo = function* (input) {
  const arr = [...input];
  const n = arr.length;
  const sorted = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  yield { array: [...arr], comparing: [], swapping: [], sorted: new Set(sorted), comparisons, swaps, line: 1, note: 'start' };

  for (let i = 0; i < n - 1; i++) {
    let didSwap = false;
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      yield { array: [...arr], comparing: [j, j + 1], swapping: [], sorted: new Set(sorted), comparisons, swaps, line: 6, note: `compare ${arr[j]} and ${arr[j + 1]}` };

      if (arr[j]! > arr[j + 1]!) {
        [arr[j], arr[j + 1]] = [arr[j + 1]!, arr[j]!];
        swaps++;
        didSwap = true;
        yield { array: [...arr], comparing: [], swapping: [j, j + 1], sorted: new Set(sorted), comparisons, swaps, line: 8, note: `swap` };
      }
    }
    sorted.add(n - i - 1);
    yield { array: [...arr], comparing: [], swapping: [], sorted: new Set(sorted), comparisons, swaps, line: 12, note: `index ${n - i - 1} fixed` };
    if (!didSwap) {
      for (let k = 0; k < n - i - 1; k++) sorted.add(k);
      yield { array: [...arr], comparing: [], swapping: [], sorted: new Set(sorted), comparisons, swaps, line: 14, note: 'no swaps — done' };
      break;
    }
  }
  for (let k = 0; k < n; k++) sorted.add(k);
  yield { array: [...arr], comparing: [], swapping: [], sorted, comparisons, swaps, line: 16, note: 'sorted' };
};
