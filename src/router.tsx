import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { SortingPage } from '@/pages/SortingPage';
import { SearchingPage } from '@/pages/SearchingPage';
import { PathfindingPage } from '@/pages/PathfindingPage';
import { GraphPage } from '@/pages/GraphPage';
import { DPPage } from '@/pages/DPPage';
import { BloomPage } from '@/pages/advanced/BloomPage';
import { HyperLogLogPage } from '@/pages/advanced/HyperLogLogPage';
import { SkipListPage } from '@/pages/advanced/SkipListPage';
import { LRUPage } from '@/pages/advanced/LRUPage';
import { RaftPage } from '@/pages/advanced/RaftPage';
import { TriePage } from '@/pages/advanced/TriePage';
import { UnionFindPage } from '@/pages/advanced/UnionFindPage';
import { NQueensPage } from '@/pages/advanced/NQueensPage';
import { MazePage } from '@/pages/advanced/MazePage';
import { ConvexHullPage } from '@/pages/advanced/ConvexHullPage';
import { GameOfLifePage } from '@/pages/advanced/GameOfLifePage';
import { DHTPage } from '@/pages/distributed/DHTPage';
import { BlockDAGPage } from '@/pages/distributed/BlockDAGPage';
import { EmbeddingsPage } from '@/pages/ai/EmbeddingsPage';
import { AttentionPage } from '@/pages/ai/AttentionPage';
import { BlochPage } from '@/pages/ai/BlochPage';
import { MultiAgentPage } from '@/pages/ai/MultiAgentPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'sorting', element: <SortingPage /> },
      { path: 'searching', element: <SearchingPage /> },
      { path: 'pathfinding', element: <PathfindingPage /> },
      { path: 'graph', element: <GraphPage /> },
      { path: 'dp', element: <DPPage /> },

      { path: 'advanced/bloom', element: <BloomPage /> },
      { path: 'advanced/hyperloglog', element: <HyperLogLogPage /> },
      { path: 'advanced/skiplist', element: <SkipListPage /> },
      { path: 'advanced/lru', element: <LRUPage /> },
      { path: 'advanced/raft', element: <RaftPage /> },
      { path: 'advanced/trie', element: <TriePage /> },
      { path: 'advanced/unionfind', element: <UnionFindPage /> },
      { path: 'advanced/nqueens', element: <NQueensPage /> },
      { path: 'advanced/maze', element: <MazePage /> },
      { path: 'advanced/convex-hull', element: <ConvexHullPage /> },
      { path: 'advanced/game-of-life', element: <GameOfLifePage /> },

      { path: 'distributed/dht', element: <DHTPage /> },
      { path: 'distributed/blockdag', element: <BlockDAGPage /> },

      { path: 'ai/embeddings', element: <EmbeddingsPage /> },
      { path: 'ai/attention', element: <AttentionPage /> },
      { path: 'ai/multi-agent', element: <MultiAgentPage /> },
      { path: 'ai/bloch', element: <BlochPage /> },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
