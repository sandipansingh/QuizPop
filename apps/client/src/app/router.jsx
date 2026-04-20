import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '../routes/_shared/components/AppShell.jsx';
import { ProtectedRoute } from '../routes/_shared/components/ProtectedRoute.jsx';
import { RouteSpinner } from '../routes/_shared/components/RouteSpinner.jsx';

const lazyPage = (loader) => async () => {
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
        lazy: lazyPage(() => import('../routes/landing/page.jsx')),
      },
      {
        path: 'login',
        lazy: lazyPage(() => import('../routes/login/page.jsx')),
      },
      {
        path: 'register',
        lazy: lazyPage(() => import('../routes/register/page.jsx')),
      },
      {
        path: 'legal/privacy',
        lazy: lazyPage(() => import('../routes/legal/privacy/page.jsx')),
      },
      {
        path: 'legal/terms',
        lazy: lazyPage(() => import('../routes/legal/terms/page.jsx')),
      },
      {
        path: 'legal/cookies',
        lazy: lazyPage(() => import('../routes/legal/cookies/page.jsx')),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'home',
            lazy: lazyPage(() => import('../routes/home/page.jsx')),
          },
          {
            path: 'quiz',
            lazy: lazyPage(() => import('../routes/quiz/page.jsx')),
          },
          {
            path: 'leaderboard',
            lazy: lazyPage(() => import('../routes/leaderboard/page.jsx')),
          },
          {
            path: 'room/:id',
            lazy: lazyPage(() => import('../routes/room/page.jsx')),
          },
          {
            path: 'result',
            lazy: lazyPage(() => import('../routes/result/page.jsx')),
          },
          {
            path: 'profile',
            lazy: lazyPage(() => import('../routes/profile/page.jsx')),
          },
          {
            path: 'players/:username',
            lazy: lazyPage(() => import('../routes/player/page.jsx')),
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
  return <RouterProvider router={router} fallbackElement={<RouteSpinner />} />;
}
