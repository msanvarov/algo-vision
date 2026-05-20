# Algorithm Visualizer

An interactive playground for sorting, pathfinding, graph algorithms, and the kind of computer science topics that don't usually get a friendly UI — Bloom filters, HyperLogLog, skip lists, LRU caches, Raft consensus, tries, and Union-Find.

Every animated algorithm is written as a generator that yields one frame per step. A single engine (`src/lib/engine.ts`) drives play / pause / step / speed / reset for all of them, so adding a new algorithm is a single file.

![dark mode UI](https://placehold.co/1200x600/0a0b10/7c5cff?text=Algorithm+Visualizer)

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS for styling, custom dark palette
- React Router for per-topic URLs
- Zero runtime backend; everything runs in the browser

## Topics

| Category | Visualizations |
| --- | --- |
| **Sorting** | bubble · quick (Lomuto) · merge · heap |
| **Pathfinding** | BFS · DFS · Dijkstra · A\* (Manhattan heuristic) on an editable weighted grid |
| **Graph** | Kruskal MST · Prim MST · Kahn topological sort · Tarjan strongly-connected components |
| **Advanced** | Bloom filter · HyperLogLog · Skip list · LRU cache · Raft leader election · Trie · Union-Find |

## Run it

```sh
npm install
npm run dev
```

Then open `http://localhost:5173`.

```sh
npm run build      # type-check + production bundle
npm run preview    # serve the built bundle
npm run typecheck  # tsc --noEmit
```

## Repo layout

```
src/
├── algorithms/
│   ├── sorting/         one file per sort + a shared types module
│   ├── pathfinding/     BFS/DFS/Dijkstra/A* sharing one grid type
│   ├── graph/           Kruskal/Prim/topo/SCC + sample graphs
│   └── ...              (advanced topics live next to their pages)
├── components/          Layout, Controls, CodePanel, Stat, Legend, PageHeader
├── lib/                 engine (generator-driven), hash, min-heap, RNG
├── pages/
│   ├── Home.tsx
│   ├── SortingPage.tsx · PathfindingPage.tsx · GraphPage.tsx
│   └── advanced/        Bloom · HLL · SkipList · LRU · Raft · Trie · UnionFind
└── router.tsx
```

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

`useStepper` runs the generator to completion, materializes all frames, and exposes `play()`, `pause()`, `stepOnce()`, `setSpeed()`, `reset()`. The visualization component just renders the current frame — no animation logic lives in the React tree.

## Keyboard

- `Space` — play / pause
- `→` — step forward one frame
- `R` — reset

## Adding a new algorithm

1. Drop a generator under `src/algorithms/<category>/<name>.ts` exporting `algo` and `code` (the pseudocode shown on the right).
2. Register it in that category's `index.ts`.
3. If it fits an existing visualization (sorting/pathfinding/graph) you're done — pick it from the dropdown on the existing page. For a new shape, add a page under `src/pages/`, plug it into `router.tsx`, and add it to the sidebar in `components/Layout.tsx`.

## License

MIT — see [LICENSE](LICENSE).
