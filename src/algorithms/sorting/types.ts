export type SortState = {
  array: number[];
  comparing: number[];
  swapping: number[];
  pivot?: number;
  sorted: Set<number>;
  comparisons: number;
  swaps: number;
};

export type SortAlgo = (input: number[]) => Generator<SortState & { line?: number; note?: string }, void, void>;

export function initialState(input: number[]): SortState {
  return {
    array: [...input],
    comparing: [],
    swapping: [],
    sorted: new Set(),
    comparisons: 0,
    swaps: 0,
  };
}
