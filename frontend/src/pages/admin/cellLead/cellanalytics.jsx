import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, CalendarCheck,
  Users, Activity, ArrowUpRight, ArrowDownRight, Filter,
  ChevronDown, RefreshCw, Calendar, Percent, Clock, Award,
  UserPlus, AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import StatsCard from '../../../components/StatsCard';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import LoadingScreen from '../../../components/LoadingScreen';
import { useToast } from '../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const CellAnalytics = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [cellSummary, setCellSummary] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [retention, setRetention] = useState(null);
  const [serviceTrends, setServiceTrends] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [firstTimers, setFirstTimers] = useState([]);

  // Period filter
  const [period, setPeriod] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (!token || !['cellLeader', 'superAdmin'].includes(user.role)) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, []);

  const fetchData = async (startDate, endDate) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const days = parseInt(period) || 30;
      const end = endDate || new Date().toISOString().slice(0, 10);
      const start = startDate || new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

      const results = await Promise.allSettled([
        axios.get(`${API}/admin/dashboard/summary`, { headers }),
        axios.get(`${API}/attendance/summary/cell`, { headers, params: { startDate: start, endDate: end } }),
        axios.get(`${API}/attendance/analytics/growth`, { headers, params: { period: 'weekly', startDate: start, endDate: end } }),
        axios.get(`${API}/attendance/analytics/retention`, { headers, params: { weeks: Math.max(Math.round(days / 7), 2) } }),
        axios.get(`${API}/attendance/analytics/trends/service`, { headers, params: { period: days } }),
        axios.get(`${API}/attendance/analytics/streaks`, { headers, params: { minStreak: 2 } }),
        axios.get(`${API}/attendance/analytics/first-timers`, { headers, params: { startDate: start, endDate: end } }),
      ]);

      const [statsR, summaryR, growthR, retentionR, svcTrendR, streaksR, firstTimersR] = results;

      if (statsR.status === 'fulfilled') setStats(statsR.value.data.data);
      if (summaryR.status === 'fulfilled') setCellSummary(summaryR.value.data.data || []);
      if (growthR.status === 'fulfilled') setGrowthData(growthR.value.data.data || []);
      if (retentionR.status === 'fulfilled') setRetention(retentionR.value.data.data);
      if (svcTrendR.status === 'fulfilled') setServiceTrends(svcTrendR.value.data.data || []);
      if (streaksR.status === 'fulfilled') setStreaks(streaksR.value.data.data || []);
      if (firstTimersR.status === 'fulfilled') setFirstTimers(firstTimersR.value.data.data || []);
    } catch {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const days = parseInt(period) || 30;
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    fetchData(start, end);
  }, [period]);

  const handleCustomRange = () => {
    if (customStart && customEnd) fetchData(customStart, customEnd);
  };

  // Growth trend
  const growthTrend = useMemo(() => {
    if (growthData.length < 2) return 0;
    const last = growthData[growthData.length - 1]?.totalMembers || 0;
    const prev = growthData[growthData.length - 2]?.totalMembers || 1;
    return Math.round(((last - prev) / (prev || 1)) * 100);
  }, [growthData]);

  // Group service trends by date for stacked bars
  const serviceTrendGrouped = useMemo(() => {
    const dates = {};
    serviceTrends.forEach((s) => {
      if (!dates[s.date]) dates[s.date] = {};
      dates[s.date][s.serviceName || s.serviceType] = s.count;
    });
    return Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)).map(([date, svcMap]) => ({ date, ...svcMap }));
  }, [serviceTrends]);

  const serviceNames = useMemo(() => {
    const set = new Set();
    serviceTrends.forEach((s) => set.add(s.serviceName || s.serviceType));
    return [...set];
  }, [serviceTrends]);

  const cellName = stats?.cellName || user.cellName || 'Your Cell';
  const totalMembers = retention?.totalMembers ?? stats?.cellMembers ?? 0;
  const rate = retention?.retentionRate ?? stats?.attendanceRate ?? 0;

  if (loading) return <LoadingScreen message="Loading analytics" submessage="Computing cell statistics..." />;

  const BAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
  const TEXT_COLORS = ['text-blue-500', 'text-purple-500', 'text-green-500', 'text-orange-500', 'text-pink-500', 'text-cyan-500'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/cell/dashboard')}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-500" /> {cellName} Analytics
          </h1>
          <div />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <Filter size={14} className="text-gray-400" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200" />
              <button onClick={handleCustomRange}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Members" value={totalMembers} icon={Users} color="blue" />
          <StatsCard title="Retention Rate" value={`${rate}%`} icon={Percent} color="green" />
          <StatsCard title="Growth Trend" value={`${growthTrend >= 0 ? '+' : ''}${growthTrend}%`} icon={growthTrend >= 0 ? TrendingUp : TrendingDown} color={growthTrend >= 0 ? 'green' : 'red'} />
          <StatsCard title="First-Timers" value={firstTimers.length} icon={UserPlus} color="purple" subtitle={period === 'custom' ? 'Custom range' : `Last ${period} days`} />
        </div>

        {/* Retention Overview */}
        {retention && (
          <Card title="Retention Overview" icon={Activity}>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{retention.activeMembers ?? 0}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Active</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{retention.atRiskMembers ?? 0}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">At Risk</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{retention.inactiveMembers ?? 0}</p>
                <p className="text-xs text-red-500">Inactive</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{retention.retentionRate ?? 0}%</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Rate</p>
              </div>
            </div>
          </Card>
        )}

        {/* Growth Tracker — weekly bar chart */}
        <Card title="Member Growth" icon={TrendingUp}
          action={
            <span className={`text-sm font-semibold flex items-center gap-1 ${growthTrend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {growthTrend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(growthTrend)}%
            </span>
          }>
          {growthData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No growth data available for this period.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-2 h-40">
                {growthData.slice(-12).map((w, i) => {
                  const max = Math.max(...growthData.slice(-12).map((x) => x.totalMembers), 1);
                  const pct = (w.totalMembers / max) * 100;
                  const isLast = i === growthData.slice(-12).length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{w.totalMembers}</span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${isLast ? 'bg-purple-600' : 'bg-purple-400 dark:bg-purple-500'}`}
                        style={{ height: `${Math.max(pct, 6)}%` }}
                      />
                      <span className="text-[9px] text-gray-400 truncate w-full text-center">
                        {new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              {growthData.length > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  New members this period: <span className="font-semibold text-purple-600">{growthData.reduce((s, d) => s + (d.newMembers || 0), 0)}</span>
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Service Type Trends — stacked bars */}
        <Card title="Service Type Trends" icon={CalendarCheck}>
          {serviceTrendGrouped.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No service data available.</p>
          ) : (
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {serviceNames.map((name, i) => (
                  <span key={name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <span className={`w-2.5 h-2.5 rounded-sm ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                    {name}
                  </span>
                ))}
              </div>
              <div className="flex items-end gap-2 h-40 overflow-x-auto pb-1">
                {serviceTrendGrouped.slice(-12).map((entry, i) => {
                  const total = serviceNames.reduce((s, n) => s + (entry[n] || 0), 0);
                  const maxTotal = Math.max(...serviceTrendGrouped.slice(-12).map((e) => serviceNames.reduce((s, n) => s + (e[n] || 0), 0)), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[30px]">
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{total}</span>
                      <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: `${Math.max((total / maxTotal) * 100, 6)}%` }}>
                        {serviceNames.map((name, si) => {
                          const count = entry[name] || 0;
                          if (count === 0) return null;
                          return <div key={name} className={`w-full ${BAR_COLORS[si % BAR_COLORS.length]}`} style={{ height: `${(count / total) * 100}%`, minHeight: '2px' }} />;
                        })}
                      </div>
                      <span className="text-[8px] text-gray-400 truncate w-full text-center">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Cell Summary */}
        {cellSummary.length > 0 && (
          <Card title={`${cellName} Overview`} icon={BarChart3}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 font-medium">Metric</th>
                    <th className="py-2 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {cellSummary.map((c, i) => (
                    <React.Fragment key={i}>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2.5 text-gray-600 dark:text-gray-300">Total Attendance</td>
                        <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-white">{c.totalAttendance}</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2.5 text-gray-600 dark:text-gray-300">Unique Members Attended</td>
                        <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-white">{c.uniqueMembers}</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2.5 text-gray-600 dark:text-gray-300">Total Members</td>
                        <td className="py-2.5 text-right font-semibold text-gray-800 dark:text-white">{c.totalMembers}</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2.5 text-gray-600 dark:text-gray-300">Average Attendance Rate</td>
                        <td className="py-2.5 text-right">
                          <span className={`font-semibold ${parseFloat(c.averageAttendance) >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                            {c.averageAttendance}%
                          </span>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Attendance Streaks */}
          <Card title="Top Attendance Streaks" icon={Award}
            action={<span className="text-xs text-gray-400">Consecutive weeks</span>}>
            {streaks.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No streak data yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {streaks.slice(0, 10).map((m, i) => (
                  <li key={m.memberId || i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${i < 3 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-400">Longest: {m.longestStreak} weeks</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{m.currentStreak}w</p>
                      <p className="text-[10px] text-gray-400">current</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* First-Timers */}
          <Card title="First-Time Attendees" icon={UserPlus}
            action={<span className="text-xs text-gray-400">{firstTimers.length} total</span>}>
            {firstTimers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No first-timers in this period.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                {firstTimers.slice(0, 15).map((m, i) => (
                  <li key={m.memberId || i} className="flex items-center gap-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-400">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-400">{m.serviceType}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(m.firstAttendanceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CellAnalytics;
