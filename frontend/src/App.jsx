import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import RootLayout from './components/RootLayout';
import LoadingScreen from './components/LoadingScreen';

// ── Auth ──────────────────────────────────────────────
const Login = lazy(() => import('./pages/auth/login'));
const Signup = lazy(() => import('./pages/auth/signup'));
const Home =lazy(()=>import('./pages/Home'))


// ── Suspense wrapper ──────────────────────────────────
const Suspended = ({ children }) => (
  <Suspense fallback={<LoadingScreen message="Loading page" submessage="Just a moment…" />}>
    {children}
  </Suspense>
);

// ── Router ────────────────────────────────────────────
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public / Auth
      { path: '/', element: <Suspended><Home /></Suspended> },
      { path: '/login', element: <Suspended><Login /></Suspended> },
      { path: '/signup', element: <Suspended><Signup /></Suspended> },

      // 404
      {
        path: '*',
        element: (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
            <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-6">Page not found</p>
            <a href="/" className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
              Go Home
            </a>
          </div>
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
