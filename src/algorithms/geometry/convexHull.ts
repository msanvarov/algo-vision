export type Point = { x: number; y: number; id: number };

export type HullState = {
  points: Point[];
  sorted: Point[];          // anchor-first sorted by polar angle
  stack: Point[];            // current hull stack
  considering?: Point;
  rejecting?: Point;         // popped this step (CW turn detected)
  hull: Point[];             // final hull (set only on completion)
  note?: string;
  line?: number;
};

export const grahamCode = `function* grahamScan(points) {
  // 1. lowest, leftmost point becomes the anchor
  const anchor = points.reduce((a, p) => a.y < p.y || (a.y === p.y && a.x < p.x) ? a : p);
  // 2. sort the rest by polar angle around the anchor
  const sorted = points.filter(p => p !== anchor)
                       .sort((a, b) => angle(anchor, a) - angle(anchor, b));
  const stack = [anchor];
  for (const p of sorted) {
    // pop while the last turn would be clockwise (or collinear)
    while (stack.length >= 2 && cross(stack[-2], stack[-1], p) <= 0) stack.pop();
    stack.push(p);
  }
  return stack; // hull in counter-clockwise order
}`;

function cross(o: Point, a: Point, b: Point) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function* grahamScan(points: Point[]): Generator<HullState, void, void> {
  if (points.length < 3) {
    yield { points, sorted: points, stack: points, hull: points };
    return;
  }

  const anchor = points.reduce((a, p) => (a.y < p.y || (a.y === p.y && a.x < p.x) ? a : p));
  const others = points.filter((p) => p.id !== anchor.id);
  const sorted = others.slice().sort((a, b) => {
    const aa = Math.atan2(a.y - anchor.y, a.x - anchor.x);
    const ab = Math.atan2(b.y - anchor.y, b.x - anchor.x);
    return aa - ab;
  });

  const stack: Point[] = [anchor];
  const snap = (extra: Partial<HullState>, line: number, note: string): HullState => ({
    points, sorted: [anchor, ...sorted],
    stack: [...stack], hull: [], line, note, ...extra,
  });

  yield snap({}, 2, `anchor = (${anchor.x.toFixed(2)}, ${anchor.y.toFixed(2)})`);
  yield snap({}, 4, 'sorted by polar angle');

  for (const p of sorted) {
    yield snap({ considering: p }, 7, `consider point ${p.id}`);
    while (stack.length >= 2 && cross(stack[stack.length - 2]!, stack[stack.length - 1]!, p) <= 0) {
      const removed = stack.pop()!;
      yield snap({ considering: p, rejecting: removed }, 9, `pop ${removed.id} (clockwise turn)`);
    }
    stack.push(p);
    yield snap({ considering: p }, 10, `push ${p.id}`);
  }

  yield snap({ hull: [...stack] }, 12, `hull complete — ${stack.length} points`);
}

export function randomPoints(n: number, seed: number): Point[] {
  let s = seed >>> 0 || 1;
  const r = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: n }, (_, id) => ({
    id, x: 0.1 + r() * 0.8, y: 0.1 + r() * 0.8,
  }));
}
