import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ScanLine, UserCheck, Clock, CalendarDays, LogOut,
  User, ChevronRight, Activity, BarChart3, Shield,
} from 'lucide-react';
import axios from 'axios';
import StatsCard from '../../components/StatsCard';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingScreen from '../../components/LoadingScreen';
import { useToast } from '../../components/ToastContext';
import NotificationBell from '../../components/NotificationBell';

const API = import.meta.env.VITE_API_BASE_URL;

const UsherDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const token = localStorage.getItem('authToken');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // ── Auth guard ────────────────────────────────────
  useEffect(() => {
    if (!user || !token || (user.role !== 'usher' && user.role !== 'superAdmin')) {
      toast.error('Unauthorized.');
      navigate('/login');
    }
  }, []);

  // ── Fetch dashboard data ──────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, serviceRes, attendanceRes] = await Promise.allSettled([
          axios.get(`${API}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/admin/service-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/attendance/date/${new Date().toISOString().split('T')[0]}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data.success) {
          setStats(dashRes.value.data.data);
        }

        if (serviceRes.status === 'fulfilled' && serviceRes.value.data.success) {
          setServiceTypes(serviceRes.value.data.data.filter((s) => s.isActive));
        }

        if (attendanceRes.status === 'fulfilled' && attendanceRes.value.data.success) {
          const records = attendanceRes.value.data.data.attendance || [];
          setRecentScans(records.slice(0, 10));
        }
      } catch {
        toast.error('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, []);

  // ── Logout ────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* ignore */ }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    toast.success('Logged out.');
    navigate('/login');
  };

  // ── Greeting based on time ────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) return <LoadingScreen message="Loading dashboard" submessage="Preparing your data..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header ───────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {greeting}, {user?.firstName || 'Usher'} 
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Shield size={14} /> Usher Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/usher/profile"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Profile">
              <User size={20} className="text-gray-600 dark:text-gray-300" />
            </Link>
            <button onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
              title="Logout">
              <LogOut size={20} className="text-red-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats cards ──────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Today's Attendance"
              value={stats.todayAttendance ?? stats.todayCellAttendance ?? 0}
              icon={UserCheck}
              color="blue"
            />
            <StatsCard
              title="Recent Attendance"
              value={stats.recentAttendance ?? stats.recentCellAttendance ?? 0}
              icon={BarChart3}
              color="green"
            />
            <StatsCard
              title="Total Members"
              value={stats.totalMembers ?? stats.cellMembers ?? 0}
              icon={Activity}
              color="purple"
            />
            <StatsCard
              title="Attendance Rate"
              value={`${stats.attendanceRate ?? 0}%`}
              icon={CalendarDays}
              color="orange"
            />
          </div>
        )}

        {/* ── Quick actions ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/usher/attendance"
            className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-xl shadow-lg transition transform hover:scale-[1.02]">
            <div className="bg-white/20 p-3 rounded-lg">
              <ScanLine size={28} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Take Attendance</p>
              <p className="text-sm opacity-80">Scan member QR codes</p>
            </div>
            <ChevronRight size={20} className="opacity-60" />
          </Link>

          <Link to="/usher/profile"
            className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-5 rounded-xl shadow transition transform hover:scale-[1.02]">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <User size={28} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-gray-900 dark:text-white">My Profile</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">View & edit your info</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* ── Active services ──────────────────────────── */}
        {serviceTypes.length > 0 && (
          <Card title="Active Services" icon={CalendarDays}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {serviceTypes.map((s) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <div key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg">
                      <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {days[s.dayOfWeek]} · {s.defaultTime?.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Recent scans today ───────────────────────── */}
        <Card title="Today's Scans" icon={UserCheck}
          action={
            <Link to="/usher/attendance" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Scan More →
            </Link>
          }>
          {recentScans.length === 0 ? (
            <p className="text-center py-8 text-gray-400 dark:text-gray-500">
              No attendance recorded today yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
              {recentScans.map((rec, i) => (
                <li key={rec.id || i} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                    {rec.firstName?.[0]}{rec.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {rec.firstName} {rec.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{rec.cellName}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {rec.checkInTime?.slice(0, 5)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UsherDashboard;
