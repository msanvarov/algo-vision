export type SearchState = {
  array: number[];
  target: number;
  range: [number, number];      // current search bounds
  probe?: number;                // index being inspected
  visited: number[];
  found?: number;
};

export type SearchAlgo = (input: { array: number[]; target: number }) => Generator<SearchState & { line?: number; note?: string }, void, void>;
