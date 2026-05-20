import type { SearchAlgo } from './types';

export const linearCode = `function* linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`;

export const linear: SearchAlgo = function* ({ array, target }) {
  const visited: number[] = [];
  for (let i = 0; i < array.length; i++) {
    visited.push(i);
    yield {
      array, target, range: [0, array.length - 1], probe: i,
      visited: [...visited], line: 3, note: `probe[${i}] = ${array[i]}`,
    };
    if (array[i] === target) {
      yield { array, target, range: [0, array.length - 1], probe: i, visited: [...visited], found: i, line: 3, note: 'match' };
      return;
    }
  }
  yield { array, target, range: [0, array.length - 1], visited: [...visited], line: 5, note: 'not found' };
};

export const binaryCode = `function* binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

export const binary: SearchAlgo = function* ({ array, target }) {
  let lo = 0;
  let hi = array.length - 1;
  const visited: number[] = [];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    visited.push(mid);
    yield {
      array, target, range: [lo, hi], probe: mid,
      visited: [...visited], line: 4, note: `mid = ${mid}, arr[mid] = ${array[mid]}`,
    };
    if (array[mid] === target) {
      yield { array, target, range: [lo, hi], probe: mid, visited: [...visited], found: mid, line: 5, note: 'match' };
      return;
    }
    if (array[mid]! < target) {
      lo = mid + 1;
      yield { array, target, range: [lo, hi], visited: [...visited], line: 6, note: 'go right' };
    } else {
      hi = mid - 1;
      yield { array, target, range: [lo, hi], visited: [...visited], line: 7, note: 'go left' };
    }
  }
  yield { array, target, range: [lo, hi], visited: [...visited], line: 9, note: 'not found' };
};

export const jumpCode = `function* jumpSearch(arr, target) {
  const step = Math.floor(Math.sqrt(arr.length));
  let prev = 0, jump = step;
  while (arr[Math.min(jump, arr.length) - 1] < target) {
    prev = jump;
    jump += step;
    if (prev >= arr.length) return -1;
  }
  for (let i = prev; i < Math.min(jump, arr.length); i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`;

export const jump: SearchAlgo = function* ({ array, target }) {
  const step = Math.max(1, Math.floor(Math.sqrt(array.length)));
  const visited: number[] = [];
  let prev = 0;
  let j = step;

  while (j <= array.length && array[Math.min(j, array.length) - 1]! < target) {
    visited.push(Math.min(j, array.length) - 1);
    yield {
      array, target, range: [prev, Math.min(j, array.length) - 1],
      probe: Math.min(j, array.length) - 1, visited: [...visited], line: 4, note: `jump past block`,
    };
    prev = j;
    j += step;
    if (prev >= array.length) {
      yield { array, target, range: [prev, array.length - 1], visited: [...visited], line: 7, note: 'past end' };
      return;
    }
  }

  for (let i = prev; i < Math.min(j, array.length); i++) {
    visited.push(i);
    yield { array, target, range: [prev, Math.min(j, array.length) - 1], probe: i, visited: [...visited], line: 10, note: `linear scan in block` };
    if (array[i] === target) {
      yield { array, target, range: [prev, Math.min(j, array.length) - 1], probe: i, visited: [...visited], found: i, line: 11, note: 'match' };
      return;
    }
  }
  yield { array, target, range: [prev, Math.min(j, array.length) - 1], visited: [...visited], line: 13, note: 'not found' };
};

export const interpolationCode = `function* interpolationSearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
    // guess where target would sit if values were uniformly distributed
    const pos = lo + Math.floor(((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo]));
    if (arr[pos] === target) return pos;
    if (arr[pos] < target) lo = pos + 1;
    else hi = pos - 1;
  }
  return -1;
}`;

export const interpolation: SearchAlgo = function* ({ array, target }) {
  let lo = 0;
  let hi = array.length - 1;
  const visited: number[] = [];
  while (lo <= hi && target >= array[lo]! && target <= array[hi]!) {
    const span = array[hi]! - array[lo]!;
    const pos = span === 0 ? lo : lo + Math.floor(((target - array[lo]!) * (hi - lo)) / span);
    visited.push(pos);
    yield { array, target, range: [lo, hi], probe: pos, visited: [...visited], line: 5, note: `guess pos = ${pos}` };
    if (array[pos] === target) {
      yield { array, target, range: [lo, hi], probe: pos, visited: [...visited], found: pos, line: 6, note: 'match' };
      return;
    }
    if (array[pos]! < target) lo = pos + 1;
    else hi = pos - 1;
  }
  yield { array, target, range: [lo, hi], visited: [...visited], line: 10, note: 'not found' };
};

export type SearchKey = 'linear' | 'binary' | 'jump' | 'interpolation';

export const SEARCHES: Record<SearchKey, { name: string; algo: SearchAlgo; code: string; complexity: string; requires: string }> = {
  linear: { name: 'Linear search', algo: linear, code: linearCode, complexity: 'O(n)', requires: 'any order' },
  binary: { name: 'Binary search', algo: binary, code: binaryCode, complexity: 'O(log n)', requires: 'sorted' },
  jump: { name: 'Jump search', algo: jump, code: jumpCode, complexity: 'O(√n)', requires: 'sorted' },
  interpolation: { name: 'Interpolation search', algo: interpolation, code: interpolationCode, complexity: 'O(log log n) ideal', requires: 'sorted + uniform' },
};
