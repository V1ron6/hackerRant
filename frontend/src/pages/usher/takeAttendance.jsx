import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, Users, CheckCircle, XCircle, Clock, ChevronDown,
  ArrowLeft, UserCheck, AlertTriangle, RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import QrCodeScanner from '../../components/QrCodeScanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToastContext';

const API = import.meta.env.VITE_API_BASE_URL;

const TakeAttendance = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Auth guard ────────────────────────────────────
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (!user || !token || (user.role !== 'usher' && user.role !== 'superAdmin')) {
      toast.error('Unauthorized. Ushers only.');
      navigate('/login');
    }
  }, []);

  // ── State ─────────────────────────────────────────
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [loadingServices, setLoadingServices] = useState(true);

  const [showScanner, setShowScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Scan log for the current session
  const [scanLog, setScanLog] = useState([]);
  const [lastResult, setLastResult] = useState(null); // { success, message, member }

  // ── Fetch service types ───────────────────────────
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get(`${API}/admin/service-types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          const active = data.data.filter((s) => s.isActive);
          setServiceTypes(active);

          // Auto-select based on current day
          const today = new Date().getDay(); // 0 = Sunday
          const match = active.find((s) => s.dayOfWeek === today);
          if (match) setSelectedService(match.id);
        }
      } catch {
        toast.error('Could not load service types.');
      } finally {
        setLoadingServices(false);
      }
    };
    if (token) fetchServices();
  }, []);

  // ── Handle QR scan ────────────────────────────────
  const handleScan = async (decodedText) => {
    if (submitting) return;
    if (!selectedService) {
      toast.warning('Please select a service type first.');
      return;
    }

    setSubmitting(true);
    setLastResult(null);

    try {
      const { data } = await axios.post(
        `${API}/attendance/scan`,
        { qrData: decodedText, serviceTypeId: selectedService },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        const entry = {
          id: Date.now(),
          success: true,
          name: data.data.member?.name || 'Unknown',
          cell: data.data.member?.cell || '',
          service: data.data.service || '',
          time: data.data.attendance?.checkInTime || new Date().toLocaleTimeString(),
        };
        setLastResult({ success: true, message: data.message, member: entry });
        setScanLog((prev) => [entry, ...prev]);
        toast.success(data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed.';
      const entry = {
        id: Date.now(),
        success: false,
        name: msg,
        cell: '',
        service: '',
        time: new Date().toLocaleTimeString(),
      };
      setLastResult({ success: false, message: msg });
      setScanLog((prev) => [entry, ...prev]);

      // Already-marked is a warning, not error
      if (err.response?.status === 400) toast.warning(msg);
      else toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Selected service label ────────────────────────
  const selectedServiceObj = serviceTypes.find((s) => s.id === selectedService);

  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Top bar ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/usher/dashboard')}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition text-sm">
            <ArrowLeft size={18} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScanLine size={20} /> Attendance
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <UserCheck size={16} />
            <span className="font-medium">{scanLog.filter((s) => s.success).length}</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* ── Service type selector ─────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Service Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              disabled={loadingServices}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 pr-10 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
            >
              <option value="">
                {loadingServices ? 'Loading services…' : 'Select service type'}
              </option>
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
          </div>
          {selectedServiceObj && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {selectedServiceObj.description}
              {selectedServiceObj.defaultTime && ` · Default time: ${selectedServiceObj.defaultTime}`}
            </p>
          )}
        </div>

        {/* ── Scanner toggle ───────────────────────── */}
        {!showScanner ? (
          <button
            onClick={() => {
              if (!selectedService) { toast.warning('Select a service type first.'); return; }
              setShowScanner(true);
            }}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-3 text-lg shadow-lg"
          >
            <ScanLine size={24} /> Open QR Scanner
          </button>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 space-y-4">
            <QrCodeScanner
              onScan={handleScan}
              onClose={() => setShowScanner(false)}
              onError={(err) => toast.error(err)}
              qrbox={220}
              fps={15}
            />
            {submitting && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <LoadingSpinner message="" /> Processing scan…
              </div>
            )}
          </div>
        )}

        {/* ── Last scan result ─────────────────────── */}
        {lastResult && (
          <div className={`rounded-xl p-4 border-l-4 shadow ${
            lastResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={22} />
              ) : (
                <XCircle className="text-red-500 shrink-0 mt-0.5" size={22} />
              )}
              <div>
                <p className={`font-semibold ${lastResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                  {lastResult.message}
                </p>
                {lastResult.member && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {lastResult.member.cell} · {lastResult.member.service} · {lastResult.member.time}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Scan log ─────────────────────────────── */}
        {scanLog.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} /> Session Log
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {scanLog.filter((s) => s.success).length} / {scanLog.length}
                </span>
              </h2>
              <button
                onClick={() => { setScanLog([]); setLastResult(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1"
              >
                <RefreshCw size={12} /> Clear
              </button>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
              {scanLog.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-5 py-3">
                  {entry.success ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      entry.success ? 'text-gray-900 dark:text-white' : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {entry.name}
                    </p>
                    {entry.cell && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.cell}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{entry.time}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Empty state ──────────────────────────── */}
        {scanLog.length === 0 && !showScanner && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No scans yet</p>
            <p className="text-sm mt-1">Select a service and open the QR scanner to begin</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TakeAttendance;
