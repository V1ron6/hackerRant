import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, CalendarCheck,
  Users, Activity, ArrowUpRight, ArrowDownRight, Filter,
  Building2, Percent, RefreshCw, Clock, Star, UserPlus,
  Shield, AlertTriangle, Eye, Flame,
} from 'lucide-react';
import axios from 'axios';
import StatsCard from '../../../../components/StatsCard';
import Card from '../../../../components/Card';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import LoadingScreen from '../../../../components/LoadingScreen';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Existing analytics
  const [analytics, setAnalytics] = useState(null);
  const [cellSummary, setCellSummary] = useState([]);

  // New analytics data
  const [retention, setRetention] = useState(null);
  const [serviceTrends, setServiceTrends] = useState([]);
  const [cellTrends, setCellTrends] = useState([]);
  const [peakTimes, setPeakTimes] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [streaks, setStreaks] = useState([]);
  const [firstTimers, setFirstTimers] = useState([]);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  const fetchData = async (days) => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const numDays = parseInt(days) || 30;
    const endStr = new Date().toISOString().slice(0, 10);
    const startStr = days === 'custom' ? customStart : new Date(Date.now() - numDays * 86400000).toISOString().slice(0, 10);
    const endVal = days === 'custom' ? customEnd : endStr;

    // Compute previous period for comparison
    const periodMs = new Date(endVal) - new Date(startStr);
    const prevEnd = new Date(new Date(startStr).getTime() - 86400000).toISOString().slice(0, 10);
    const prevStart = new Date(new Date(startStr).getTime() - periodMs - 86400000).toISOString().slice(0, 10);

    try {
      const results = await Promise.allSettled([
        axios.get(`${API}/attendance/analytics`, { headers, params: { period: numDays } }),
        axios.get(`${API}/attendance/summary/cell`, { headers, params: { startDate: startStr, endDate: endVal } }),
        axios.get(`${API}/attendance/analytics/retention`, { headers, params: { weeks: Math.max(Math.round(numDays / 7), 1) } }),
        axios.get(`${API}/attendance/analytics/trends/service`, { headers, params: { period: numDays } }),
        axios.get(`${API}/attendance/analytics/trends/cell`, { headers, params: { period: numDays } }),
        axios.get(`${API}/attendance/analytics/peak-times`, { headers, params: { period: numDays } }),
        axios.get(`${API}/attendance/compare/periods`, {
          headers,
          params: { period1Start: startStr, period1End: endVal, period2Start: prevStart, period2End: prevEnd },
        }),
        axios.get(`${API}/attendance/analytics/streaks`, { headers, params: { minStreak: 3 } }),
        axios.get(`${API}/attendance/analytics/first-timers`, { headers, params: { startDate: startStr, endDate: endVal } }),
        axios.get(`${API}/attendance/absentees/chronic`, { headers, params: { minMissed: 3 } }),
      ]);

      const val = (i) => results[i].status === 'fulfilled' ? results[i].value.data.data : null;
      if (val(0)) setAnalytics(val(0));
      if (val(1)) setCellSummary(Array.isArray(val(1)) ? val(1) : []);
      if (val(2)) setRetention(val(2));
      if (val(3)) setServiceTrends(Array.isArray(val(3)) ? val(3) : []);
      if (val(4)) setCellTrends(Array.isArray(val(4)) ? val(4) : []);
      if (val(5)) setPeakTimes(Array.isArray(val(5)) ? val(5) : []);
      if (val(6)) setComparison(val(6));
      if (val(7)) setStreaks(Array.isArray(val(7)) ? val(7) : []);
      if (val(8)) setFirstTimers(Array.isArray(val(8)) ? val(8) : []);
      if (val(9)) setChronicAbsentees(Array.isArray(val(9)) ? val(9) : []);
    } catch { toast.error('Failed to load analytics.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (token && period !== 'custom') fetchData(period);
  }, [period]);

  const handleCustom = () => {
    if (customStart && customEnd) fetchData('custom');
  };

  // Trend from weekly data
  const trend = useMemo(() => {
    const t = analytics?.trend || [];
    if (t.length < 2) return 0;
    const last = t[t.length - 1]?.count || 0;
    const prev = t[t.length - 2]?.count || 1;
    return Math.round(((last - prev) / prev) * 100);
  }, [analytics]);

  // Top cell
  const topCell = useMemo(() => {
    if (!cellSummary.length) return null;
    return [...cellSummary].sort((a, b) => parseFloat(b.averageAttendance) - parseFloat(a.averageAttendance))[0];
  }, [cellSummary]);

  // Group service trends by date for stacked-style display
  const serviceGrouped = useMemo(() => {
    const map = {};
    serviceTrends.forEach((s) => {
      if (!map[s.date]) map[s.date] = {};
      map[s.date][s.serviceName || s.serviceType] = s.count;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [serviceTrends]);

  // Unique service names
  const serviceNames = useMemo(() => {
    const names = new Set();
    serviceTrends.forEach((s) => names.add(s.serviceName || s.serviceType));
    return [...names];
  }, [serviceTrends]);

  // Group cell trends by date
  const cellGrouped = useMemo(() => {
    const map = {};
    cellTrends.forEach((c) => {
      if (!map[c.date]) map[c.date] = {};
      map[c.date][c.cellName] = c.count;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [cellTrends]);

  const cellNamesList = useMemo(() => {
    const names = new Set();
    cellTrends.forEach((c) => names.add(c.cellName));
    return [...names];
  }, [cellTrends]);

  if (loading) return <LoadingScreen message="Loading analytics" submessage="Computing statistics..." />;

  const overview = analytics?.overview || {};
  const trendData = analytics?.trend || [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" /> Analytics
          </h1>
          <button onClick={() => fetchData(period)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg border border-gray-800 px-3 py-2">
            <Filter size={14} className="text-gray-500" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm text-gray-200 focus:outline-none">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-sm border border-gray-700 rounded-lg px-3 py-2 bg-gray-900 text-gray-200" />
              <span className="text-gray-500 text-sm">to</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-sm border border-gray-700 rounded-lg px-3 py-2 bg-gray-900 text-gray-200" />
              <button onClick={handleCustom}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── Stats row ───────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Attendance" value={overview.totalAttendance ?? 0} icon={CalendarCheck} color="green" subtitle={analytics?.period || ''} />
          <StatsCard title="Total Members" value={overview.totalMembers ?? 0} icon={Users} color="blue" />
          <StatsCard title="Retention Rate" value={retention ? `${retention.retentionRate}%` : '—'} icon={Shield} color="purple" />
          <StatsCard title="Weekly Trend" value={`${trend >= 0 ? '+' : ''}${trend}%`} icon={trend >= 0 ? TrendingUp : TrendingDown} color={trend >= 0 ? 'green' : 'red'} />
        </div>

        {/* ── Period comparison ────────────────────── */}
        {comparison && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Current Period</p>
              <p className="text-2xl font-bold text-white">{comparison.period1?.totalAttendance ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Avg {comparison.period1?.avgPerDay}/day · {comparison.period1?.rate}%</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Previous Period</p>
              <p className="text-2xl font-bold text-gray-400">{comparison.period2?.totalAttendance ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Avg {comparison.period2?.avgPerDay}/day · {comparison.period2?.rate}%</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center">
              <div className={`flex items-center gap-1 text-lg font-bold ${comparison.delta?.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {comparison.delta?.direction === 'up' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                {comparison.delta?.rate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {comparison.delta?.attendance > 0 ? '+' : ''}{comparison.delta?.attendance} attendance
              </p>
            </div>
          </div>
        )}

        {/* ── Retention overview ──────────────────── */}
        {retention && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-green-900/20 border border-green-900/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{retention.activeMembers}</p>
              <p className="text-xs text-green-500 mt-1">Active</p>
            </div>
            <div className="bg-orange-900/20 border border-orange-900/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{retention.atRiskMembers}</p>
              <p className="text-xs text-orange-500 mt-1">At Risk</p>
            </div>
            <div className="bg-red-900/20 border border-red-900/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{retention.inactiveMembers}</p>
              <p className="text-xs text-red-500 mt-1">Inactive</p>
            </div>
            <div className="bg-purple-900/20 border border-purple-900/30 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{retention.retentionRate}%</p>
              <p className="text-xs text-purple-500 mt-1">Retention ({retention.period})</p>
            </div>
          </div>
        )}

        {/* ── Attendance trend chart ──────────────── */}
        <Card title="Attendance Trend" icon={TrendingUp}
          className="!bg-gray-900 !border-gray-800 border"
          action={
            <span className={`text-sm font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(trend)}%
            </span>
          }>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No trend data available.</p>
          ) : (
            <div className="flex items-end gap-2 h-44">
              {trendData.map((t, i) => {
                const max = Math.max(...trendData.map((x) => x.count), 1);
                const pct = (t.count / max) * 100;
                const isLast = i === trendData.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">{t.count}</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${isLast ? 'bg-purple-500' : 'bg-purple-700'}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-[8px] text-gray-500 truncate w-full text-center">
                      {new Date(t.dateOfAttendance).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Service type trends (time series) ───── */}
        {serviceGrouped.length > 0 && (
          <Card title="Service Type Trends" icon={Activity} className="!bg-gray-900 !border-gray-800 border">
            <div className="mb-3 flex flex-wrap gap-3">
              {serviceNames.map((name, i) => {
                const colors = ['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-orange-400', 'bg-red-400'];
                return (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                    {name}
                  </span>
                );
              })}
            </div>
            <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1">
              {serviceGrouped.map(([date, services], di) => {
                const total = Object.values(services).reduce((a, b) => a + b, 0);
                const maxTotal = Math.max(...serviceGrouped.map(([, s]) => Object.values(s).reduce((a, b) => a + b, 0)), 1);
                const pct = (total / maxTotal) * 100;
                return (
                  <div key={di} className="flex-1 min-w-[30px] flex flex-col items-center gap-1" title={`${date}: ${total}`}>
                    <span className="text-[9px] text-gray-500 font-semibold">{total}</span>
                    <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${Math.max(pct, 4)}%` }}>
                      {serviceNames.map((name, si) => {
                        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
                        const val = services[name] || 0;
                        const segPct = total > 0 ? (val / total) * 100 : 0;
                        return <div key={si} className={`${colors[si % colors.length]} w-full`} style={{ height: `${segPct}%` }} />;
                      })}
                    </div>
                    <span className="text-[7px] text-gray-600 truncate w-full text-center">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Cell Trends (time series) ───────────── */}
        {cellGrouped.length > 0 && (
          <Card title="Cell Group Trends" icon={Building2} className="!bg-gray-900 !border-gray-800 border">
            <div className="mb-3 flex flex-wrap gap-3">
              {cellNamesList.map((name, i) => {
                const colors = ['bg-indigo-400', 'bg-teal-400', 'bg-amber-400', 'bg-pink-400', 'bg-cyan-400'];
                return (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                    {name}
                  </span>
                );
              })}
            </div>
            <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1">
              {cellGrouped.map(([date, cells], di) => {
                const total = Object.values(cells).reduce((a, b) => a + b, 0);
                const maxTotal = Math.max(...cellGrouped.map(([, c]) => Object.values(c).reduce((a, b) => a + b, 0)), 1);
                const pct = (total / maxTotal) * 100;
                return (
                  <div key={di} className="flex-1 min-w-[30px] flex flex-col items-center gap-1" title={`${date}: ${total}`}>
                    <span className="text-[9px] text-gray-500 font-semibold">{total}</span>
                    <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${Math.max(pct, 4)}%` }}>
                      {cellNamesList.map((name, ci) => {
                        const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];
                        const val = cells[name] || 0;
                        const segPct = total > 0 ? (val / total) * 100 : 0;
                        return <div key={ci} className={`${colors[ci % colors.length]} w-full`} style={{ height: `${segPct}%` }} />;
                      })}
                    </div>
                    <span className="text-[7px] text-gray-600 truncate w-full text-center">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── Peak Times ──────────────────────────── */}
        {peakTimes.length > 0 && (
          <Card title="Peak Check-in Times" icon={Clock} className="!bg-gray-900 !border-gray-800 border">
            <div className="flex items-end gap-2 h-36">
              {peakTimes.map((p) => {
                const max = Math.max(...peakTimes.map((x) => x.count), 1);
                const pct = (p.count / max) * 100;
                const isPeak = p.count === max;
                return (
                  <div key={p.hour} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-gray-400">{p.count}</span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${isPeak ? 'bg-yellow-500' : 'bg-blue-600'}`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-[9px] text-gray-500">{p.hour}:00</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Peak hour: {peakTimes.reduce((a, b) => a.count > b.count ? a : b, { hour: 0, count: 0 }).hour}:00
            </p>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Attendance Streaks ─────────────────── */}
          {streaks.length > 0 && (
            <Card title="Top Attendance Streaks" icon={Flame}
              className="!bg-gray-900 !border-gray-800 border"
              action={<span className="text-xs text-gray-500">{streaks.length} members</span>}>
              <ul className="space-y-2.5 max-h-72 overflow-y-auto">
                {streaks.slice(0, 10).map((s, i) => (
                  <li key={s.memberId || i} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-gray-800 text-gray-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.cellName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-400">{s.currentStreak}w</p>
                      <p className="text-[10px] text-gray-600">Best: {s.longestStreak}w</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ── First-Timers ──────────────────────── */}
          {firstTimers.length > 0 && (
            <Card title="First-Time Attendees" icon={UserPlus}
              className="!bg-gray-900 !border-gray-800 border"
              action={<span className="text-xs text-gray-500">{firstTimers.length} new</span>}>
              <ul className="space-y-2.5 max-h-72 overflow-y-auto">
                {firstTimers.slice(0, 10).map((f, i) => (
                  <li key={f.memberId || i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-900/40 flex items-center justify-center text-xs font-bold text-green-400">
                      {f.firstName?.[0]}{f.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{f.firstName} {f.lastName}</p>
                      <p className="text-xs text-gray-500">{f.cellName} · {f.serviceType}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(f.firstAttendanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* ── Chronic Absentees ───────────────────── */}
        {chronicAbsentees.length > 0 && (
          <Card title="Chronic Absentees" icon={AlertTriangle}
            className="!bg-gray-900 !border-gray-800 border"
            action={<span className="text-xs text-red-400">{chronicAbsentees.length} members</span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800 text-xs uppercase tracking-wider">
                    <th className="py-2 font-medium">Member</th>
                    <th className="py-2 font-medium">Cell</th>
                    <th className="py-2 font-medium text-center">Missed</th>
                    <th className="py-2 font-medium">Last Seen</th>
                    <th className="py-2 font-medium hidden md:table-cell">Last Service</th>
                  </tr>
                </thead>
                <tbody>
                  {chronicAbsentees.slice(0, 15).map((a, i) => (
                    <tr key={a.memberId || i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2.5">
                        <p className="font-medium text-gray-200">{a.firstName} {a.lastName}</p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </td>
                      <td className="py-2.5 text-gray-400 text-xs">{a.cellName}</td>
                      <td className="py-2.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                          a.consecutiveMissed >= 5 ? 'bg-red-900/40 text-red-400' : 'bg-orange-900/40 text-orange-400'
                        }`}>{a.consecutiveMissed}</span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">
                        {a.lastSeenDate ? new Date(a.lastSeenDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs hidden md:table-cell">{a.lastServiceType || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Cell summary table ──────────────────── */}
        {cellSummary.length > 0 && (
          <Card title="Cell Attendance Summary" icon={BarChart3}
            className="!bg-gray-900 !border-gray-800 border"
            action={topCell && (
              <span className="text-xs text-green-400">
                Top: {topCell.cellName} ({topCell.averageAttendance}%)
              </span>
            )}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="py-2 font-medium">Cell</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-right">Unique</th>
                    <th className="py-2 font-medium text-right">Members</th>
                    <th className="py-2 font-medium text-right">Days</th>
                    <th className="py-2 font-medium text-right">Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {cellSummary.map((c, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2.5 font-medium text-gray-200">{c.cellName}</td>
                      <td className="py-2.5 text-right text-gray-400">{c.totalAttendance}</td>
                      <td className="py-2.5 text-right text-gray-400">{c.uniqueMembers}</td>
                      <td className="py-2.5 text-right text-gray-400">{c.totalMembers}</td>
                      <td className="py-2.5 text-right text-gray-400">{c.daysTracked}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-semibold ${parseFloat(c.averageAttendance) >= 50 ? 'text-green-400' : 'text-orange-400'}`}>
                          {c.averageAttendance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;
