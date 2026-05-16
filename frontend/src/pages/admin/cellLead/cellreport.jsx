import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Calendar, Filter, ChevronDown, Download,
  UserX, UserCheck, Clock, Mail, Phone, Users, AlertCircle,
  CheckCircle, RefreshCw, Search, X, Printer,
} from 'lucide-react';
import axios from 'axios';
import Card from '../../../components/Card';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useToast } from '../../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const CellReport = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);

  // Attendance report
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);

  // Absentees
  const [absenteeData, setAbsenteeData] = useState(null);
  const [absenteeSearch, setAbsenteeSearch] = useState('');

  // Summary (date range)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [summaryData, setSummaryData] = useState([]);

  // Active tab
  const [tab, setTab] = useState('attendance');

  useEffect(() => {
    if (!token || !['cellLeader', 'superAdmin'].includes(user.role)) {
      toast.error('Access denied.');
      navigate('/login');
    }
  }, []);

  // Fetch service types
  useEffect(() => {
    if (!token) return;
    axios.get(`${API}/admin/service-types`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => { if (data.success) setServices(data.data || []); })
      .catch(() => {});
  }, []);

  // Fetch attendance report for a date
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (serviceTypeId) params.serviceTypeId = serviceTypeId;
      const { data } = await axios.get(`${API}/attendance/date/${reportDate}`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      if (data.success) setAttendanceData(data.data);
    } catch {
      toast.error('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch absentees
  const fetchAbsentees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (serviceTypeId) params.serviceTypeId = serviceTypeId;
      const { data } = await axios.get(`${API}/attendance/absentees/${reportDate}`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      if (data.success) setAbsenteeData(data.data);
    } catch {
      toast.error('Failed to load absentees.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/attendance/summary/cell`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
      });
      if (data.success) setSummaryData(data.data || []);
    } catch {
      toast.error('Failed to load summary.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on tab change or when user hits generate
  const handleGenerate = () => {
    if (tab === 'attendance') fetchAttendance();
    else if (tab === 'absentees') fetchAbsentees();
    else fetchSummary();
  };

  // Filtered absentees
  const filteredAbsentees = useMemo(() => {
    if (!absenteeData?.absenteesByCell) return {};
    if (!absenteeSearch.trim()) return absenteeData.absenteesByCell;
    const q = absenteeSearch.toLowerCase();
    const result = {};
    Object.entries(absenteeData.absenteesByCell).forEach(([cell, list]) => {
      const filtered = list.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
      if (filtered.length) result[cell] = filtered;
    });
    return result;
  }, [absenteeData, absenteeSearch]);

  const totalAbsenteesFiltered = Object.values(filteredAbsentees).reduce((s, arr) => s + arr.length, 0);

  // Export CSV
  const exportCSV = () => {
    let csv = '';
    if (tab === 'attendance' && attendanceData?.attendance?.length) {
      csv = 'Name,Email,Cell,Check-in Time,Service\n';
      attendanceData.attendance.forEach((a) => {
        csv += `"${a.firstName} ${a.lastName}","${a.email}","${a.cellName}","${a.checkInTime}","${a.serviceType?.name || ''}"\n`;
      });
    } else if (tab === 'absentees' && absenteeData?.absenteesByCell) {
      csv = 'Name,Email,Phone,Cell\n';
      Object.entries(absenteeData.absenteesByCell).forEach(([cell, list]) => {
        list.forEach((m) => {
          csv += `"${m.firstName} ${m.lastName}","${m.email}","${m.phoneNumber}","${cell}"\n`;
        });
      });
    } else if (tab === 'summary' && summaryData.length) {
      csv = 'Cell,Total Attendance,Unique Members,Total Members,Avg %\n';
      summaryData.forEach((c) => {
        csv += `"${c.cellName}",${c.totalAttendance},${c.uniqueMembers},${c.totalMembers},${c.averageAttendance}\n`;
      });
    }
    if (!csv) { toast.warning('No data to export.'); return; }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cell-report-${tab}-${reportDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  };

  const TABS = [
    { key: 'attendance', label: 'Attendance', icon: CheckCircle },
    { key: 'absentees', label: 'Absentees', icon: UserX },
    { key: 'summary', label: 'Summary', icon: FileText },
  ];

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
            <FileText size={20} className="text-orange-500" /> {user.cellName || 'Cell'} Reports
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition">
              <Download size={15} /> CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium transition
                ${tab === t.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          {tab !== 'summary' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Service (optional)</label>
                <div className="relative">
                  <select value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)}
                    className="appearance-none border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[180px]">
                    <option value="">All services</option>
                    {services.filter((s) => s.isActive).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </>
          )}
          <button onClick={handleGenerate} disabled={loading}
            className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-60 flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
            Generate
          </button>
        </div>

        {loading && <LoadingSpinner message="Generating report…" />}

        {/* ── Attendance tab ──────────────────────────── */}
        {!loading && tab === 'attendance' && attendanceData && (
          <div className="space-y-4">
            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-green-600">{attendanceData.totalPresent}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-blue-600">{attendanceData.totalMembers}</p>
                <p className="text-xs text-gray-500">Total Members</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-purple-600">{attendanceData.attendancePercentage}%</p>
                <p className="text-xs text-gray-500">Rate</p>
              </div>
            </div>

            <Card title={`Attendance — ${new Date(attendanceData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`} icon={CheckCircle}
              action={<span className="text-sm text-gray-400">{attendanceData.attendance?.length || 0} records</span>}>
              {(!attendanceData.attendance || attendanceData.attendance.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-8">No attendance records for this date.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 font-medium">#</th>
                        <th className="py-2 font-medium">Name</th>
                        <th className="py-2 font-medium hidden sm:table-cell">Email</th>
                        <th className="py-2 font-medium">Service</th>
                        <th className="py-2 font-medium text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.attendance.map((a, i) => (
                        <tr key={a.id || i} className="border-b border-gray-100 dark:border-gray-700/50">
                          <td className="py-2.5 text-gray-400">{i + 1}</td>
                          <td className="py-2.5 font-medium text-gray-800 dark:text-white">{a.firstName} {a.lastName}</td>
                          <td className="py-2.5 text-gray-500 hidden sm:table-cell">{a.email}</td>
                          <td className="py-2.5 text-gray-600 dark:text-gray-300">{a.serviceType?.name || '—'}</td>
                          <td className="py-2.5 text-right text-gray-500">{a.checkInTime?.slice(0, 5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Absentees tab ──────────────────────────── */}
        {!loading && tab === 'absentees' && absenteeData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-red-500">{absenteeData.totalAbsentees}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-blue-600">{absenteeData.totalMembers}</p>
                <p className="text-xs text-gray-500">Total Members</p>
              </div>
            </div>

            <Card title={`Absentees — ${new Date(absenteeData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`} icon={UserX}
              action={
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
                  <input type="text" value={absenteeSearch} onChange={(e) => setAbsenteeSearch(e.target.value)}
                    placeholder="Search absentees…"
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-400 w-44" />
                </div>
              }>
              {Object.keys(filteredAbsentees).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No absentees found.</p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {Object.entries(filteredAbsentees).map(([cell, list]) => (
                    <div key={cell}>
                      {Object.keys(filteredAbsentees).length > 1 && (
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Users size={13} /> {cell} <span className="text-gray-300">({list.length})</span>
                        </h4>
                      )}
                      <ul className="space-y-1.5">
                        {list.map((m) => (
                          <li key={m.id} className="flex items-center gap-3 px-3 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600">
                              {m.firstName?.[0]}{m.lastName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                              <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                                <Mail size={10} /> {m.email}
                              </p>
                            </div>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0">
                              <Phone size={10} /> {m.phoneNumber}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Summary tab ────────────────────────────── */}
        {!loading && tab === 'summary' && summaryData.length > 0 && (
          <Card title={`${user.cellName || 'Your Cell'} Summary`} icon={FileText}
            action={<span className="text-xs text-gray-400">{startDate} → {endDate}</span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 font-medium">Cell</th>
                    <th className="py-2 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-right">Unique</th>
                    <th className="py-2 font-medium text-right">Members</th>
                    <th className="py-2 font-medium text-right">Days</th>
                    <th className="py-2 font-medium text-right">Avg %</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((c, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-3 font-medium text-gray-800 dark:text-white">{c.cellName}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{c.totalAttendance}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{c.uniqueMembers}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{c.totalMembers}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{c.daysTracked}</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${parseFloat(c.averageAttendance) >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
                          {c.averageAttendance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visual bars */}
            <div className="mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance Breakdown</h4>
              {summaryData.map((c, i) => {
                const max = Math.max(...summaryData.map((x) => x.totalAttendance), 1);
                const pct = (c.totalAttendance / max) * 100;
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{c.cellName}</span>
                      <span className="text-gray-500">{c.totalAttendance}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className={`h-2.5 ${colors[i % colors.length]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Empty state when nothing generated yet */}
        {!loading && !attendanceData && !absenteeData && summaryData.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Generate a Report</p>
            <p className="text-sm mt-1">Select a date and click Generate.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CellReport;
