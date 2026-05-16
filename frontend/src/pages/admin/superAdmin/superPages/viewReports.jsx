import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Calendar, Filter, Download,
  CheckCircle, XCircle, Building2, ChevronDown, Users,
  Clock, UserX, Search, RefreshCw, BarChart3, AlertTriangle,
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { useToast } from '../../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const TABS = ['attendance', 'absentees', 'summary', 'chronic'];
const TAB_LABELS = { attendance: 'Attendance', absentees: 'Absentees', summary: 'Cell Summary', chronic: 'Chronic Absentees' };

const ViewReports = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const today = new Date().toISOString().slice(0, 10);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('attendance');
  const [date, setDate] = useState(today);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [cells, setCells] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [cellFilter, setCellFilter] = useState('');

  // Date range for summary
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(today);

  // Data
  const [attendance, setAttendance] = useState(null);
  const [absentees, setAbsentees] = useState(null);
  const [summary, setSummary] = useState([]);
  const [chronicAbsentees, setChronicAbsentees] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token || user.role !== 'superAdmin') {
      toast.error('Super Admin access required.');
      navigate('/admin/login');
    }
  }, []);

  // Load service types & cells once
  useEffect(() => {
    const init = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [stRes, cRes] = await Promise.allSettled([
          axios.get(`${API}/admin/service-types`, { headers }),
          axios.get(`${API}/admin/cells`, { headers }),
        ]);
        if (stRes.status === 'fulfilled') setServiceTypes(stRes.value.data.data || []);
        if (cRes.status === 'fulfilled') setCells(cRes.value.data.data || []);
      } catch { /* silent */ }
    };
    if (token) init();
  }, []);

  // Fetch data on tab / filter change
  useEffect(() => { if (token) fetchReport(); }, [tab, date, serviceFilter, cellFilter, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    const params = {};
    if (serviceFilter) params.serviceTypeId = serviceFilter;
    if (cellFilter) params.cellName = cellFilter;

    try {
      if (tab === 'attendance') {
        const { data } = await axios.get(`${API}/attendance/date/${date}`, { headers, params });
        if (data.success) setAttendance(data.data);
      } else if (tab === 'absentees') {
        const { data } = await axios.get(`${API}/attendance/absentees/${date}`, { headers, params });
        if (data.success) setAbsentees(data.data);
      } else if (tab === 'summary') {
        const { data } = await axios.get(`${API}/attendance/summary/cell`, {
          headers, params: { ...params, startDate, endDate },
        });
        if (data.success) setSummary(data.data || []);
      } else if (tab === 'chronic') {
        const { data } = await axios.get(`${API}/attendance/absentees/chronic`, {
          headers, params: { ...params, minMissed: 3 },
        });
        if (data.success) setChronicAbsentees(data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report.');
    } finally { setLoading(false); }
  };

  // Filtered attendance list
  const filteredAttendance = useMemo(() => {
    if (!attendance?.attendance) return [];
    if (!search.trim()) return attendance.attendance;
    const q = search.toLowerCase();
    return attendance.attendance.filter((a) =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.cellName?.toLowerCase().includes(q)
    );
  }, [attendance, search]);

  // CSV export
  const exportCSV = () => {
    let rows = [];
    let filename = '';

    if (tab === 'attendance' && attendance?.attendance) {
      rows = [['Name', 'Email', 'Cell', 'Check-in Time', 'Service', 'Usher']];
      attendance.attendance.forEach((a) => {
        rows.push([
          `${a.firstName} ${a.lastName}`,
          a.email,
          a.cellName,
          a.checkInTime,
          a.serviceType?.name || '',
          a.usher ? `${a.usher.firstName} ${a.usher.lastName}` : '',
        ]);
      });
      filename = `attendance_${date}.csv`;
    } else if (tab === 'absentees' && absentees?.absenteesByCell) {
      rows = [['Name', 'Email', 'Phone', 'Cell']];
      Object.entries(absentees.absenteesByCell).forEach(([, members]) => {
        members.forEach((m) => rows.push([`${m.firstName} ${m.lastName}`, m.email, m.phoneNumber, m.cellName]));
      });
      filename = `absentees_${date}.csv`;
    } else if (tab === 'summary') {
      rows = [['Cell', 'Total Attendance', 'Unique Members', 'Total Members', 'Avg Attendance %', 'Days Tracked']];
      summary.forEach((s) => {
        rows.push([s.cellName, s.totalAttendance, s.uniqueMembers, s.totalMembers, `${s.averageAttendance}%`, s.daysTracked]);
      });
      filename = `cell_summary_${startDate}_${endDate}.csv`;
    } else if (tab === 'chronic') {
      rows = [['Name', 'Email', 'Cell', 'Consecutive Missed', 'Last Seen', 'Last Service']];
      chronicAbsentees.forEach((m) => {
        rows.push([`${m.firstName} ${m.lastName}`, m.email || '', m.cellName || '', m.consecutiveMissed, m.lastSeen || '', m.lastServiceType || '']);
      });
      filename = `chronic_absentees.csv`;
    }

    if (rows.length <= 1) return;
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('CSV downloaded.');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-sm transition">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FileText size={20} className="text-orange-400" /> Reports
          </h1>
          <button onClick={exportCSV} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 hover:bg-gray-700 transition">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-3">
          {(tab === 'attendance' || tab === 'absentees') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}
          {tab === 'summary' && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </>
          )}

          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">Service</label>
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">All services</option>
              {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 bottom-3 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">Cell</label>
            <select value={cellFilter} onChange={(e) => setCellFilter(e.target.value)}
              className="appearance-none bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">All cells</option>
              {cells.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 bottom-3 text-gray-500 pointer-events-none" />
          </div>

          <button onClick={fetchReport} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition self-end">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner message="Loading report…" /></div>
        ) : (
          <>
            {/* ── Attendance tab ────────────────── */}
            {tab === 'attendance' && attendance && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Total Present</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{attendance.totalPresent}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Total Members</p>
                    <p className="text-2xl font-bold text-gray-200 mt-1">{attendance.totalMembers}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Attendance Rate</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{attendance.attendancePercentage}%</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Absent</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{attendance.totalMembers - attendance.totalPresent}</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search attendees…"
                    className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>

                {/* Table */}
                {filteredAttendance.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users size={40} className="mx-auto mb-2 opacity-40" />
                    <p>No attendance records for this date.</p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                          <th className="text-left px-4 py-3">#</th>
                          <th className="text-left px-4 py-3">Name</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell">Email</th>
                          <th className="text-left px-4 py-3">Cell</th>
                          <th className="text-left px-4 py-3">Check-in</th>
                          <th className="text-left px-4 py-3 hidden lg:table-cell">Service</th>
                          <th className="text-left px-4 py-3 hidden lg:table-cell">Usher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredAttendance.map((a, i) => (
                          <tr key={a.id} className="hover:bg-gray-800/30 transition">
                            <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-gray-200">{a.firstName} {a.lastName}</p>
                            </td>
                            <td className="px-4 py-2.5 hidden md:table-cell text-gray-400">{a.email}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{a.cellName}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-300 font-mono text-xs">{a.checkInTime?.slice(0, 5)}</td>
                            <td className="px-4 py-2.5 hidden lg:table-cell text-gray-400 text-xs">{a.serviceType?.name}</td>
                            <td className="px-4 py-2.5 hidden lg:table-cell text-gray-500 text-xs">
                              {a.usher ? `${a.usher.firstName} ${a.usher.lastName}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 bg-gray-800/30 text-xs text-gray-500">
                      Showing {filteredAttendance.length} of {attendance.attendance.length} records
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Absentees tab ────────────────── */}
            {tab === 'absentees' && absentees && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Total Absentees</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{absentees.totalAbsentees}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Total Members</p>
                    <p className="text-2xl font-bold text-gray-200 mt-1">{absentees.totalMembers}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500">Absence Rate</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">
                      {absentees.totalMembers ? ((absentees.totalAbsentees / absentees.totalMembers) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>

                {absentees.absenteesByCell && Object.keys(absentees.absenteesByCell).length > 0 ? (
                  Object.entries(absentees.absenteesByCell).map(([cellName, members]) => (
                    <div key={cellName} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-800/50 flex items-center gap-2">
                        <Building2 size={14} className="text-purple-400" />
                        <h3 className="text-sm font-semibold text-gray-300">{cellName}</h3>
                        <span className="text-xs text-gray-500 ml-auto">{members.length} absent</span>
                      </div>
                      <ul className="divide-y divide-gray-800">
                        {members.map((m) => (
                          <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/30">
                            <UserX size={14} className="text-red-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-200">{m.firstName} {m.lastName}</p>
                              <p className="text-xs text-gray-500">{m.email}</p>
                            </div>
                            <span className="text-xs text-gray-500">{m.phoneNumber}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle size={40} className="mx-auto mb-2 text-green-500 opacity-40" />
                    <p>No absentees for this date!</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Cell Summary tab ─────────────── */}
            {tab === 'summary' && (
              <div className="space-y-4">
                {summary.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 size={40} className="mx-auto mb-2 opacity-40" />
                    <p>No summary data for this period.</p>
                  </div>
                ) : (
                  <>
                    {/* Visual bars */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-gray-400 mb-4">Average Attendance by Cell</h3>
                      <div className="space-y-3">
                        {(() => {
                          const maxAvg = Math.max(...summary.map((s) => parseFloat(s.averageAttendance) || 0), 1);
                          return summary.map((s) => {
                            const pct = ((parseFloat(s.averageAttendance) || 0) / maxAvg) * 100;
                            return (
                              <div key={s.cellName}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-300 font-medium">{s.cellName}</span>
                                  <span className="text-gray-500">{s.averageAttendance}%</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Cell</th>
                            <th className="text-right px-4 py-3">Total Attendance</th>
                            <th className="text-right px-4 py-3">Unique Members</th>
                            <th className="text-right px-4 py-3">Total Members</th>
                            <th className="text-right px-4 py-3">Avg %</th>
                            <th className="text-right px-4 py-3">Days Tracked</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {summary.map((s) => {
                            const best = summary.reduce((a, b) =>
                              parseFloat(a.averageAttendance) > parseFloat(b.averageAttendance) ? a : b
                            );
                            const isBest = s.cellName === best.cellName;
                            return (
                              <tr key={s.cellName} className={`hover:bg-gray-800/30 transition ${isBest ? 'bg-green-900/10' : ''}`}>
                                <td className="px-4 py-3 font-medium text-gray-200 flex items-center gap-2">
                                  <Building2 size={14} className="text-purple-400" />
                                  {s.cellName}
                                  {isBest && <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded-full">Top</span>}
                                </td>
                                <td className="px-4 py-3 text-right text-gray-300">{s.totalAttendance}</td>
                                <td className="px-4 py-3 text-right text-gray-300">{s.uniqueMembers}</td>
                                <td className="px-4 py-3 text-right text-gray-300">{s.totalMembers}</td>
                                <td className="px-4 py-3 text-right font-bold text-orange-400">{s.averageAttendance}%</td>
                                <td className="px-4 py-3 text-right text-gray-500">{s.daysTracked}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-800/50 font-medium">
                            <td className="px-4 py-3 text-gray-300">Totals</td>
                            <td className="px-4 py-3 text-right text-gray-200">{summary.reduce((a, s) => a + (s.totalAttendance || 0), 0)}</td>
                            <td className="px-4 py-3 text-right text-gray-200">{summary.reduce((a, s) => a + (s.uniqueMembers || 0), 0)}</td>
                            <td className="px-4 py-3 text-right text-gray-200">{summary.reduce((a, s) => a + (s.totalMembers || 0), 0)}</td>
                            <td className="px-4 py-3 text-right text-orange-300">
                              {(summary.reduce((a, s) => a + parseFloat(s.averageAttendance || 0), 0) / (summary.length || 1)).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">—</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Chronic Absentees tab ────────── */}
            {tab === 'chronic' && (
              <div className="space-y-4">
                {chronicAbsentees.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle size={40} className="mx-auto mb-2 text-green-500 opacity-40" />
                    <p>No chronic absentees found.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Chronic Absentees</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">{chronicAbsentees.length}</p>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Avg Missed</p>
                        <p className="text-2xl font-bold text-orange-400 mt-1">
                          {(chronicAbsentees.reduce((a, m) => a + (m.consecutiveMissed || 0), 0) / (chronicAbsentees.length || 1)).toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500">Cells Affected</p>
                        <p className="text-2xl font-bold text-purple-400 mt-1">
                          {new Set(chronicAbsentees.map((m) => m.cellName).filter(Boolean)).size}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                            <th className="text-left px-4 py-3">#</th>
                            <th className="text-left px-4 py-3">Name</th>
                            <th className="text-left px-4 py-3">Cell</th>
                            <th className="text-right px-4 py-3">Missed</th>
                            <th className="text-left px-4 py-3">Last Seen</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">Last Service</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {chronicAbsentees.map((m, i) => (
                            <tr key={m.memberId || i} className="hover:bg-gray-800/30 transition">
                              <td className="px-4 py-2.5 text-gray-500">{i + 1}</td>
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-gray-200">{m.firstName} {m.lastName}</p>
                                {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{m.cellName || '—'}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <span className={`font-bold ${m.consecutiveMissed >= 5 ? 'text-red-400' : 'text-orange-400'}`}>
                                  {m.consecutiveMissed}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-gray-400 text-xs">
                                {m.lastSeen ? new Date(m.lastSeen).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs hidden md:table-cell">{m.lastServiceType || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-2 bg-gray-800/30 text-xs text-gray-500 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-orange-400" />
                        Members who missed 3+ consecutive services
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ViewReports;
