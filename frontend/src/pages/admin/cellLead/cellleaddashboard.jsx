import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, CalendarCheck, TrendingUp, TrendingDown, Clock, UserCheck,
  BarChart3, FileText, ChevronRight, LogOut, Shield, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, UserMinus, RefreshCw,
  AlertTriangle, Bell,
} from 'lucide-react';
import axios from 'axios';
import StatsCard from '../../../components/StatsCard';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import NotificationBell from '../../../components/NotificationBell';
import LoadingScreen from '../../../components/LoadingScreen';
import { useToast } from '../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const CellLeadDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [recentAll, setRecentAll] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [retention, setRetention] = useState(null);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);

  // Auth guard
  useEffect(() => {
    if (!token || !['cellLeader', 'superAdmin'].includes(user.role)) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, []);

  // Fetch all data
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, todayRes, membersRes, svcRes, summaryRes, growthRes, retentionRes, chronicRes] = await Promise.allSettled([
          axios.get(`${API}/admin/dashboard`, { headers }),
          axios.get(`${API}/attendance/date/${today}`, { headers }),
          axios.get(`${API}/admin/members`, { headers }),
          axios.get(`${API}/admin/service-types`, { headers }),
          axios.get(`${API}/attendance/summary/cell`, { headers }),
          axios.get(`${API}/attendance/analytics/growth`, { headers, params: { period: 'weekly' } }),
          axios.get(`${API}/attendance/analytics/retention`, { headers, params: { weeks: 4 } }),
          axios.get(`${API}/attendance/absentees/chronic`, { headers, params: { minMissed: 3 } }),
        ]);

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
        if (todayRes.status === 'fulfilled') {
          const d = todayRes.value.data.data;
          setTodayAttendance(d.attendance || []);
        }
        if (membersRes.status === 'fulfilled') setMembers(membersRes.value.data.data || []);
        if (svcRes.status === 'fulfilled') setServices(svcRes.value.data.data || []);
        if (summaryRes.status === 'fulfilled') setRecentAll(summaryRes.value.data.data || []);
        if (growthRes.status === 'fulfilled') setGrowthData(growthRes.value.data.data || []);
        if (retentionRes.status === 'fulfilled') setRetention(retentionRes.value.data.data);
        if (chronicRes.status === 'fulfilled') setChronicAbsentees(chronicRes.value.data.data || []);
      } catch {
        toast.error('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAll();
  }, []);

  // Growth trend from real API data
  const growthTrend = useMemo(() => {
    if (growthData.length < 2) return 0;
    const last = growthData[growthData.length - 1]?.newMembers || 0;
    const prev = growthData[growthData.length - 2]?.newMembers || 1;
    return Math.round(((last - prev) / (prev || 1)) * 100);
  }, [growthData]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* */ }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) return <LoadingScreen message="Loading cell dashboard" submessage="Preparing dashboard data..." />;

  const cellName = stats?.cellName || user.cellName || 'Your Cell';
  const totalMembers = stats?.cellMembers ?? members.length;
  const todayCount = stats?.todayCellAttendance ?? todayAttendance.length;
  const recentCount = stats?.recentCellAttendance ?? 0;
  const rate = stats?.attendanceRate ?? 0;

  // Active vs inactive members
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const inactiveMembers = members.filter((m) => m.status !== 'active').length;

  const quickActionIconClasses = {
    blue: { box: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-300' },
    purple: { box: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-300' },
    orange: { box: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-600 dark:text-orange-300' },
    pink: { box: 'bg-pink-100 dark:bg-pink-900/30', icon: 'text-pink-600 dark:text-pink-300' },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield size={20} className="text-purple-500" /> {cellName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Welcome, {user.firstName || 'Leader'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => window.location.reload()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Cell Members" value={totalMembers} icon={Users} color="blue" />
          <StatsCard title="Today's Attendance" value={todayCount} icon={CalendarCheck} color="green" />
          <StatsCard title="Recent Attendance" value={recentCount} icon={Activity} color="purple" subtitle="Last 30 days" />
          <StatsCard title="Attendance Rate" value={`${rate}%`} icon={BarChart3} color="orange" />
        </div>

        {/* Growth Tracker */}
        <Card title="Growth Tracker" icon={TrendingUp}
          action={
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${growthTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {growthTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(growthTrend)}% this week
            </span>
          }>
          {growthData.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
              Not enough data yet — check back after a few services.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-end gap-2 h-32">
                {growthData.slice(-8).map((w, i) => {
                  const max = Math.max(...growthData.slice(-8).map((x) => x.totalMembers), 1);
                  const pct = (w.totalMembers / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{w.totalMembers}</span>
                      <div
                        className="w-full bg-purple-500 dark:bg-purple-400 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 truncate w-full text-center">
                        {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Members</p>
                  <p className="text-lg font-bold text-green-600">{activeMembers}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inactive</p>
                  <p className="text-lg font-bold text-red-500">{inactiveMembers}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rate</p>
                  <p className="text-lg font-bold text-purple-600">{rate}%</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Retention Overview */}
        {retention && (
          <Card title="Retention Overview" icon={Activity}>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{retention.active ?? 0}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Active</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{retention.atRisk ?? 0}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">At Risk</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{retention.inactive ?? 0}</p>
                <p className="text-xs text-red-500">Inactive</p>
              </div>
            </div>
            {retention.retentionRate != null && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                Retention rate: <span className="font-semibold text-purple-600">{retention.retentionRate}%</span>
              </p>
            )}
          </Card>
        )}

        {/* Chronic Absentees Warning */}
        {chronicAbsentees.length > 0 && (
          <Card title="Chronic Absentees" icon={AlertTriangle}>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-52 overflow-y-auto">
              {chronicAbsentees.map((m, i) => (
                <li key={m.memberId || i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-700 dark:text-red-400">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-400">{m.cellGroup || 'Unknown cell'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">{m.consecutiveMissed} missed</p>
                    {m.lastSeen && (
                      <p className="text-xs text-gray-400">Last: {new Date(m.lastSeen).toLocaleDateString()}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Today's check-ins */}
          <Card title="Today's Check-ins" icon={UserCheck}
            action={<span className="text-sm text-gray-500">{todayCount} present</span>}>
            {todayAttendance.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No check-ins yet today.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                {todayAttendance.slice(0, 10).map((a, i) => (
                  <li key={a.id || i} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400">
                      {a.firstName?.[0]}{a.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {a.firstName} {a.lastName}
                      </p>
                      {a.serviceType && (
                        <p className="text-xs text-gray-400">{a.serviceType.name}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {a.checkInTime?.slice(0, 5)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Quick actions */}
          <div className="space-y-4">
            <Card title="Quick Actions" icon={ChevronRight}>
              <div className="space-y-2">
                {[
                  { to: '/cell/members', label: 'Manage Members', icon: Users, desc: `${totalMembers} members`, color: 'blue' },
                  { to: '/cell/analytics', label: 'View Analytics', icon: BarChart3, desc: 'Attendance trends', color: 'purple' },
                  { to: '/cell/report', label: 'Reports & Absentees', icon: FileText, desc: 'Generate reports', color: 'orange' },
                  { to: '/cell/notifications', label: 'Notifications', icon: Bell, desc: 'Send & manage', color: 'pink' },
                ].map((item) => {
                  const iconStyle = quickActionIconClasses[item.color] || {
                    box: 'bg-gray-100 dark:bg-gray-800',
                    icon: 'text-gray-600 dark:text-gray-300',
                  };

                  return (
                    <Link key={item.to} to={item.to}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconStyle.box}`}>
                        <item.icon size={18} className={iconStyle.icon} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
                    </Link>
                  );
                })}
              </div>
            </Card>

            {/* Member status summary */}
            <Card title="Cell Summary" icon={Activity}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <UserCheck size={20} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">{activeMembers}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Active</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <UserMinus size={20} className="mx-auto text-red-500 mb-1" />
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">{inactiveMembers}</p>
                  <p className="text-xs text-red-500">Inactive</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Active services */}
        {services.length > 0 && (
          <Card title="Service Types" icon={CalendarCheck}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.filter((s) => s.isActive).map((svc) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <div key={svc.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                    <div className="w-9 h-9 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                      {days[svc.dayOfWeek]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{svc.name}</p>
                      <p className="text-xs text-gray-400">{svc.defaultTime?.slice(0, 5)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CellLeadDashboard;
