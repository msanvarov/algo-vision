import { bubble, bubbleCode } from './bubble';
import { quick, quickCode } from './quick';
import { merge, mergeCode } from './merge';
import { heap, heapCode } from './heap';
import type { SortAlgo } from './types';

export type SortKey = 'bubble' | 'quick' | 'merge' | 'heap';

export const SORTERS: Record<SortKey, { name: string; algo: SortAlgo; code: string; complexity: string; stable: boolean }> = {
  bubble: { name: 'Bubble sort', algo: bubble, code: bubbleCode, complexity: 'O(n²)', stable: true },
  quick: { name: 'Quick sort', algo: quick, code: quickCode, complexity: 'O(n log n) avg, O(n²) worst', stable: false },
  merge: { name: 'Merge sort', algo: merge, code: mergeCode, complexity: 'O(n log n)', stable: true },
  heap: { name: 'Heap sort', algo: heap, code: heapCode, complexity: 'O(n log n)', stable: false },
};

export { initialState } from './types';
export type { SortState } from './types';
