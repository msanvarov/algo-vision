# Algo Vision

Twenty-two interactive visualizations of how things actually compute — from bubble sort to Raft consensus, from Bloom filters to the Bloch sphere. Every animated algorithm is written as a generator that yields one step at a time, so you can pause anywhere, drop the speed, and read the pseudocode highlight in lockstep with the visualization.

> Built by [Sal Anvarov](https://www.sal-anvarov.com/).

[![CI](https://github.com/msanvarov/algo-vision/actions/workflows/ci.yml/badge.svg)](https://github.com/msanvarov/algo-vision/actions/workflows/ci.yml)

---

## Highlights

- **22 visualizations** across foundations, data structures, distributed systems, AI, and quantum.
- **One animation engine.** Every steppable algorithm is a `function*` that yields immutable frames; a single `useStepper` hook handles play / pause / step / speed / reset.
- **Editable inputs.** Click cells on the pathfinding grid to draw walls. Hover an attention row. Crash a Raft node. Drag a Bloch-sphere viewport.
- **Strict TypeScript** end-to-end, zero runtime backend, ~300 KB gzipped bundle.
- **Keyboard-driven.** `Space` toggles play, `→` steps, `R` resets — works on every page.

---

## Quick start

```sh
pnpm i        # or npm i / yarn
pnpm dev      # http://localhost:5173
```

Build & deploy:

```sh
pnpm build    # tsc --noEmit && vite build → dist/
pnpm preview  # serve the built bundle locally
```

Requires Node 20+ (Node 22 used in CI).

---

## Table of contents

### Foundations

| # | Topic | What it shows |
| --- | --- | --- |
| 01 | [Sorting](src/algorithms/sorting/) | bubble · quick (Lomuto) · merge · heap, with comparing/swapping/pivot/sorted colors |
| 02 | [Searching](src/algorithms/searching/) | linear · binary · jump · interpolation on a sorted array |
| 03 | [Pathfinding](src/algorithms/pathfinding/) | BFS · DFS · Dijkstra · A\* on an editable weighted grid |
| 04 | [Graph](src/algorithms/graph/) | Kruskal MST · Prim MST · Kahn topological sort · Tarjan SCC |
| 05 | [Dynamic programming](src/algorithms/dp/) | LCS · edit distance, with consulted cells + reconstruction path |

### Data structures

| # | Topic | What it shows |
| --- | --- | --- |
| 06 | [Bloom filter](src/pages/advanced/BloomPage.tsx) | bit array, k hashes, false-positive estimate `(1 − e^(−kn/m))^k` |
| 07 | [HyperLogLog](src/pages/advanced/HyperLogLogPage.tsx) | register heatmap + cardinality estimate vs. truth |
| 08 | [Skip list](src/pages/advanced/SkipListPage.tsx) | multi-lane structure with the traversed search path highlighted |
| 09 | [LRU cache](src/pages/advanced/LRUPage.tsx) | recency list + hit/miss feed |
| 10 | [Trie](src/pages/advanced/TriePage.tsx) | prefix tree with tidy layout, autocomplete preview |
| 11 | [Union-Find](src/pages/advanced/UnionFindPage.tsx) | forest with rank annotations + path-compression flash |

### Algorithms

| # | Topic | What it shows |
| --- | --- | --- |
| 12 | [N-Queens](src/algorithms/backtracking/nqueens.ts) | backtracking with conflict lines and attack-set overlay |
| 13 | [Maze generation](src/algorithms/maze/algos.ts) | recursive backtracker · Prim's maze; wall-knock animation |
| 14 | [Convex hull](src/algorithms/geometry/convexHull.ts) | Graham scan: polar sort, stack pushes, clockwise-turn pops |
| 15 | [Game of Life](src/pages/advanced/GameOfLifePage.tsx) | Conway's cellular automata; pre-built glider/pulsar/r-pentomino |

### Distributed systems

| # | Topic | What it shows |
| --- | --- | --- |
| 16 | [Raft](src/pages/advanced/RaftPage.tsx) | leader election across 5 nodes — click to crash/recover |
| 17 | [DHTs](src/pages/distributed/DHTPage.tsx) | consistent hashing · Chord · Kademlia · Pastry · CAN · IPFS, side-by-side |
| 18 | [BlockDAG](src/pages/distributed/BlockDAGPage.tsx) | concurrent ledger where blocks reference multiple unconfirmed tips |

### AI & quantum

| # | Topic | What it shows |
| --- | --- | --- |
| 19 | [Embeddings](src/pages/ai/EmbeddingsPage.tsx) | high-dim cluster centers projected to 2D via PCA |
| 20 | [Attention](src/pages/ai/AttentionPage.tsx) | token × token heatmap for four hand-crafted "attention heads" |
| 21 | [Multi-agent flow](src/pages/ai/MultiAgentPage.tsx) | message-passing between Planner / Researcher / Writer / Reviewer / Debugger |
| 22 | [Bloch sphere](src/pages/ai/BlochPage.tsx) | qubit state as a vector on a 3D sphere; H, X, Y, Z, S, T, Rx/Ry gates |

---

## How the engine works

Every animated algorithm is a `function*` that yields immutable snapshots of its state, plus an optional `line` to highlight in the code panel:

```ts
export const bubble: SortAlgo = function* (input) {
  const arr = [...input];
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      yield { array: [...arr], comparing: [j, j + 1], line: 6 };
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield { array: [...arr], swapping: [j, j + 1], line: 8 };
      }
    }
  }
};
```

`useStepper` (in [src/lib/engine.ts](src/lib/engine.ts)) runs the generator to completion, materializes every frame, and exposes:

```ts
const { state, step, totalSteps, playing, play, pause, toggle, stepOnce, reset, setSpeed } =
  useStepper({ runner, input, initial });
```

The visualization renders `state` directly — no animation logic lives in React. Speed control just changes the rate at which the index advances; pause stops it; reset rewinds to 0.

For algorithms that are inherently interactive (Bloom filter inserts, LRU put/get, Game of Life ticks, Raft simulation), the engine is bypassed in favor of plain React state + `requestAnimationFrame`.

---

## Repo layout

```
algo-vision/
├── src/
│   ├── algorithms/         pure logic, one folder per category
│   │   ├── sorting/          bubble · quick · merge · heap
│   │   ├── searching/        linear · binary · jump · interpolation
│   │   ├── pathfinding/      bfs · dfs · dijkstra · astar
│   │   ├── graph/            kruskal · prim · topo · scc + sample graphs
│   │   ├── dp/               lcs · edit distance
│   │   ├── backtracking/     n-queens
│   │   ├── maze/             recursive backtracker · prim
│   │   └── geometry/         convex hull (graham scan)
│   ├── components/         Layout · PageHeader · Controls · CodePanel · Stat · Legend
│   ├── lib/                engine (generator runner), hash (FNV-1a + Murmur3), min-heap, RNG
│   ├── pages/
│   │   ├── Home.tsx          editorial table of contents
│   │   ├── SortingPage.tsx · SearchingPage.tsx · PathfindingPage.tsx · GraphPage.tsx · DPPage.tsx
│   │   ├── advanced/         data structures + standalone algorithms (11 pages)
│   │   ├── distributed/      DHT · BlockDAG
│   │   └── ai/               Embeddings · Attention · MultiAgent · Bloch
│   ├── router.tsx
│   ├── index.css
│   └── main.tsx
├── .github/workflows/ci.yml    typecheck + build on push/PR
├── tailwind.config.ts          editorial palette + Instrument Serif
├── vite.config.ts              @ → src alias
└── tsconfig.json               strict everything
```

---

## Design notes

The visual language is intentionally restrained:

- **Palette**: warm-neutral charcoal and one signature accent (sand `#c9a06b`). Viz state colors are deliberately desaturated — muted teal for "comparing", muted sage for "done", muted rose for "warn".
- **Typography**: Inter for UI, **Instrument Serif** for the wordmark and section numbers, JetBrains Mono for code, stats, and metadata.
- **No gradient text, no glow shadows, no pulsing chips.** A visualization should look like a craftsperson's tool, not a marketing landing page.
- **Tabular numerals** everywhere a number changes during animation so the layout doesn't jitter.
- **Density**: stat blocks render as a typographic definition list, not framed cards. Borders carry the structure; fills are used sparingly.

---

## Adding a new visualization

For algorithms that fit the step-engine model:

```
src/algorithms/<category>/<name>.ts   →  export `algo` (generator) + `code` (pseudocode string)
src/pages/<Category>Page.tsx          →  optional new page, or register on an existing dropdown
src/router.tsx                         →  add the route
src/components/Layout.tsx              →  add to the sidebar
src/pages/Home.tsx                     →  add to the index
```

For interactive visualizations (no fixed sequence of steps), skip the generator and render React state directly.

---

## Keyboard

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `→` | Step forward one frame |
| `R` | Reset |

---

## CI

`.github/workflows/ci.yml` runs `tsc --noEmit` and `vite build` on every push to `master` and every pull request. The build is the type-check, so a green CI run means every file compiles under `strict: true`.

---

## License

[MIT](LICENSE).
