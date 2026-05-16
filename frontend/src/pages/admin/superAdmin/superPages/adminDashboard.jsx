import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, CalendarCheck, BarChart3, Shield, LogOut, RefreshCw,
  ChevronRight, Activity, UserCheck, Clock, Building2,
  UserPlus, FileText, MessageSquare, TrendingUp, Crown, Bell,
} from 'lucide-react';
import axios from 'axios';
import StatsCard from '../../../../components/StatsCard';
import Card from '../../../../components/Card';
import NotificationBell from '../../../../components/NotificationBell';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import LoadingScreen from '../../../../components/LoadingScreen';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [cells, setCells] = useState([]);
  const [services, setServices] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [summaryRes, cellsRes, svcRes, todayRes] = await Promise.allSettled([
          axios.get(`${API}/admin/dashboard/summary`, { headers }),
          axios.get(`${API}/admin/cells`, { headers }),
          axios.get(`${API}/admin/service-types`, { headers }),
          axios.get(`${API}/attendance/date/${today}`, { headers }),
        ]);
        if (summaryRes.status === 'fulfilled') setStats(summaryRes.value.data.data);
        if (cellsRes.status === 'fulfilled') setCells(cellsRes.value.data.data || []);
        if (svcRes.status === 'fulfilled') setServices(svcRes.value.data.data || []);
        if (todayRes.status === 'fulfilled') setTodayAttendance(todayRes.value.data.data?.attendance || []);
      } catch { toast.error('Failed to load dashboard.'); }
      finally { setLoading(false); }
    };
    if (token) fetchAll();
  }, []);

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }); } catch {}
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (loading) return <LoadingScreen message="Loading admin dashboard" submessage="Preparing overview data..." />;

  const totalMembers = stats?.totalMembers ?? 0;
  const totalCells = stats?.totalCells ?? cells.length;
  const totalAdmins = stats?.totalPrivilegedUsers ?? 0;
  const todayCount = stats?.todayAttendance ?? todayAttendance.length;
  const recentCount = stats?.last30DaysAttendance ?? 0;
  const rate = stats?.last30DaysRate ?? stats?.todayRate ?? 0;
  const newThisMonth = stats?.newMembersThisMonth ?? 0;

  const quickActions = [
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, desc: 'Attendance trends & insights', color: 'purple' },
    { to: '/admin/cell-leads', label: 'Cell Leads & Ushers', icon: Shield, desc: `${totalAdmins} privileged users`, color: 'blue' },
    { to: '/admin/members', label: 'Members', icon: Users, desc: `${totalMembers} registered members`, color: 'green' },
    { to: '/admin/reports', label: 'Reports', icon: FileText, desc: 'Attendance & absentee reports', color: 'orange' },
    { to: '/admin/messages', label: 'Send Message', icon: MessageSquare, desc: 'Broadcast notifications', color: 'red' },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell, desc: 'Manage all notifications', color: 'pink' },
  ];

  const quickActionIconClasses = {
    purple: { box: 'bg-purple-900/40', icon: 'text-purple-300' },
    blue: { box: 'bg-blue-900/40', icon: 'text-blue-300' },
    green: { box: 'bg-green-900/40', icon: 'text-green-300' },
    orange: { box: 'bg-orange-900/40', icon: 'text-orange-300' },
    red: { box: 'bg-red-900/40', icon: 'text-red-300' },
    pink: { box: 'bg-pink-900/40', icon: 'text-pink-300' },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Crown size={20} className="text-yellow-400" /> Super Admin
            </h1>
            <p className="text-xs text-gray-400">Welcome, {user.firstName || 'Admin'}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell variant="dark" />
            <button onClick={() => window.location.reload()}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
              <RefreshCw size={18} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 rounded-lg transition">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard title="Total Members" value={totalMembers} icon={Users} color="blue" />
          <StatsCard title="Total Cells" value={totalCells} icon={Building2} color="purple" />
          <StatsCard title="Privileged Users" value={totalAdmins} icon={Shield} color="orange" />
          <StatsCard title="Today's Attendance" value={todayCount} icon={CalendarCheck} color="green" />
          <StatsCard title="Recent (30 days)" value={recentCount} icon={Activity} color="blue" />
          <StatsCard title="New This Month" value={newThisMonth} icon={UserPlus} color="green" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card title="Quick Actions" icon={ChevronRight} className="!bg-gray-900 !border-gray-800 border">
              <div className="space-y-1">
                {quickActions.map((item) => {
                  const iconStyle = quickActionIconClasses[item.color] || { box: 'bg-gray-800', icon: 'text-gray-300' };

                  return (
                    <Link key={item.to} to={item.to}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/60 transition group">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconStyle.box}`}>
                        <item.icon size={17} className={iconStyle.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100">{item.label}</p>
                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition" />
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Today's attendance */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Today's Check-ins" icon={UserCheck}
              className="!bg-gray-900 !border-gray-800 border"
              action={<span className="text-sm text-gray-500">{todayCount} present</span>}>
              {todayAttendance.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No check-ins yet today.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-800">
                        <th className="py-2 font-medium">#</th>
                        <th className="py-2 font-medium">Name</th>
                        <th className="py-2 font-medium hidden sm:table-cell">Cell</th>
                        <th className="py-2 font-medium hidden md:table-cell">Service</th>
                        <th className="py-2 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAttendance.slice(0, 15).map((a, i) => (
                        <tr key={a.id || i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-2.5 text-gray-500">{i + 1}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-green-900/40 flex items-center justify-center text-[10px] font-bold text-green-400">
                                {a.firstName?.[0]}{a.lastName?.[0]}
                              </div>
                              <span className="text-gray-200 font-medium">{a.firstName} {a.lastName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-gray-400 hidden sm:table-cell">{a.cellName}</td>
                          <td className="py-2.5 text-gray-400 hidden md:table-cell">{a.serviceType?.name || '—'}</td>
                          <td className="py-2.5 text-right text-gray-500 flex items-center justify-end gap-1">
                            <Clock size={12} /> {a.checkInTime?.slice(0, 5)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {todayAttendance.length > 15 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      + {todayAttendance.length - 15} more check-ins
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Cells overview */}
          <Card title="Cell Groups" icon={Building2}
            className="!bg-gray-900 !border-gray-800 border"
            action={<span className="text-sm text-gray-500">{cells.length} cells</span>}>
            {cells.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No cell groups found.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {cells.map((cell) => (
                  <li key={cell.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-purple-900/40 flex items-center justify-center">
                      <Building2 size={16} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{cell.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {cell.memberCount} members
                        {cell.leader && ` · Led by ${cell.leader.firstName} ${cell.leader.lastName}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cell.isActive ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                      {cell.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Active services */}
          <Card title="Service Types" icon={CalendarCheck}
            className="!bg-gray-900 !border-gray-800 border"
            action={<span className="text-sm text-gray-500">{services.filter(s => s.isActive).length} active</span>}>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No service types found.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {services.map((svc) => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <li key={svc.id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
                      <div className="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-400">
                        {days[svc.dayOfWeek]?.slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{svc.name}</p>
                        <p className="text-[11px] text-gray-500">{days[svc.dayOfWeek]} at {svc.defaultTime?.slice(0, 5)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${svc.isActive ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                        {svc.isActive ? 'Active' : 'Off'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
