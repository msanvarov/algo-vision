import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { SortingPage } from '@/pages/SortingPage';
import { PathfindingPage } from '@/pages/PathfindingPage';
import { GraphPage } from '@/pages/GraphPage';
import { BloomPage } from '@/pages/advanced/BloomPage';
import { HyperLogLogPage } from '@/pages/advanced/HyperLogLogPage';
import { SkipListPage } from '@/pages/advanced/SkipListPage';
import { LRUPage } from '@/pages/advanced/LRUPage';
import { RaftPage } from '@/pages/advanced/RaftPage';
import { TriePage } from '@/pages/advanced/TriePage';
import { UnionFindPage } from '@/pages/advanced/UnionFindPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'sorting', element: <SortingPage /> },
      { path: 'pathfinding', element: <PathfindingPage /> },
      { path: 'graph', element: <GraphPage /> },
      { path: 'advanced/bloom', element: <BloomPage /> },
      { path: 'advanced/hyperloglog', element: <HyperLogLogPage /> },
      { path: 'advanced/skiplist', element: <SkipListPage /> },
      { path: 'advanced/lru', element: <LRUPage /> },
      { path: 'advanced/raft', element: <RaftPage /> },
      { path: 'advanced/trie', element: <TriePage /> },
      { path: 'advanced/unionfind', element: <UnionFindPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
