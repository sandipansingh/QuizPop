import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '../routes/_shared/components/AppShell';
import { ProtectedRoute } from '../routes/_shared/components/ProtectedRoute';

const lazyPage =
  (loader: () => Promise<{ default: React.ComponentType }>) => async () => {
    const module = await loader();
    return { Component: module.default };
  };

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import('../routes/landing/page')),
      },
      {
        path: 'login',
        lazy: lazyPage(() => import('../routes/login/page')),
      },
      {
        path: 'register',
        lazy: lazyPage(() => import('../routes/register/page')),
      },
      {
        path: 'legal/privacy',
        lazy: lazyPage(() => import('../routes/legal/privacy/page')),
      },
      {
        path: 'legal/terms',
        lazy: lazyPage(() => import('../routes/legal/terms/page')),
      },
      {
        path: 'legal/cookies',
        lazy: lazyPage(() => import('../routes/legal/cookies/page')),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'home',
            lazy: lazyPage(() => import('../routes/home/page')),
          },
          {
            path: 'quiz',
            lazy: lazyPage(() => import('../routes/quiz/page')),
          },
          {
            path: 'leaderboard',
            lazy: lazyPage(() => import('../routes/leaderboard/page')),
          },
          {
            path: 'room/:id',
            lazy: lazyPage(() => import('../routes/room/page')),
          },
          {
            path: 'result',
            lazy: lazyPage(() => import('../routes/result/page')),
          },
          {
            path: 'profile',
            lazy: lazyPage(() => import('../routes/profile/page')),
          },
          {
            path: 'players/:username',
            lazy: lazyPage(() => import('../routes/player/page')),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
