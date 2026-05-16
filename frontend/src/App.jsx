import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import RootLayout from './components/RootLayout';
import LoadingScreen from './components/LoadingScreen';

// ── Auth ──────────────────────────────────────────────
const Login = lazy(() => import('./pages/auth/login'));
const Signup = lazy(() => import('./pages/auth/signup'));

// ── User ──────────────────────────────────────────────
const UserDashboard = lazy(() => import('./pages/Users/userDashboard'));
const UserProfile = lazy(() => import('./pages/Users/userProfile'));

// ── Usher ─────────────────────────────────────────────
const UsherDashboard = lazy(() => import('./pages/usher/usherdashboard'));
const UsherProfile = lazy(() => import('./pages/usher/usherprofile'));
const TakeAttendance = lazy(() => import('./pages/usher/takeAttendance'));

// ── Cell Lead ─────────────────────────────────────────
const CellLeadDashboard = lazy(() => import('./pages/admin/cellLead/cellleaddashboard'));
const CellAnalytics = lazy(() => import('./pages/admin/cellLead/cellanalytics'));
const CellMembers = lazy(() => import('./pages/admin/cellLead/cellmembers'));
const CellReport = lazy(() => import('./pages/admin/cellLead/cellreport'));

// ── Super Admin ───────────────────────────────────────
const AdminLogin = lazy(() => import('./pages/admin/superAdmin/secure/adminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/superAdmin/superPages/adminDashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/superAdmin/superPages/analysics'));
const CellLeadManagement = lazy(() => import('./pages/admin/superAdmin/superPages/cellleadmanagement'));
const MembersManagement = lazy(() => import('./pages/admin/superAdmin/superPages/membersmanagement'));
const SendMessage = lazy(() => import('./pages/admin/superAdmin/superPages/sendMessage'));
const ViewReports = lazy(() => import('./pages/admin/superAdmin/superPages/viewReports'));
const ManageNotifications = lazy(() => import('./pages/admin/superAdmin/superPages/manageNotifications'));
const CellNotifications = lazy(() => import('./pages/admin/cellLead/cellnotifications'));

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
      { path: '/', element: <Suspended><Login /></Suspended> },
      { path: '/login', element: <Suspended><Login /></Suspended> },
      { path: '/signup', element: <Suspended><Signup /></Suspended> },

      // User
      { path: '/dashboard', element: <Suspended><UserDashboard /></Suspended> },
      { path: '/profile', element: <Suspended><UserProfile /></Suspended> },

      // Usher
      { path: '/usher/dashboard', element: <Suspended><UsherDashboard /></Suspended> },
      { path: '/usher/profile', element: <Suspended><UsherProfile /></Suspended> },
      { path: '/usher/attendance', element: <Suspended><TakeAttendance /></Suspended> },

      // Cell Lead
      { path: '/cell/dashboard', element: <Suspended><CellLeadDashboard /></Suspended> },
      { path: '/cell/analytics', element: <Suspended><CellAnalytics /></Suspended> },
      { path: '/cell/members', element: <Suspended><CellMembers /></Suspended> },
      { path: '/cell/report', element: <Suspended><CellReport /></Suspended> },
      { path: '/cell/notifications', element: <Suspended><CellNotifications /></Suspended> },

      // Super Admin
      { path: '/admin/login', element: <Suspended><AdminLogin /></Suspended> },
      { path: '/admin/dashboard', element: <Suspended><AdminDashboard /></Suspended> },
      { path: '/admin/analytics', element: <Suspended><AdminAnalytics /></Suspended> },
      { path: '/admin/cell-leads', element: <Suspended><CellLeadManagement /></Suspended> },
      { path: '/admin/members', element: <Suspended><MembersManagement /></Suspended> },
      { path: '/admin/messages', element: <Suspended><SendMessage /></Suspended> },
      { path: '/admin/reports', element: <Suspended><ViewReports /></Suspended> },
      { path: '/admin/notifications', element: <Suspended><ManageNotifications /></Suspended> },

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
