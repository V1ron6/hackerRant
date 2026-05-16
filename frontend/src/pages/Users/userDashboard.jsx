import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, QrCode, CalendarCheck, LogOut, ChevronRight,
  Clock, Download, CheckCircle, Shield, Calendar,
} from 'lucide-react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import StatsCard from '../../components/StatsCard';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import LoadingScreen from '../../components/LoadingScreen';
import { useToast } from '../../components/ToastContext';
import NotificationBell from '../../components/NotificationBell';

const API = import.meta.env.VITE_API_BASE_URL;

const UserDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  const token = localStorage.getItem('authToken');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── Auth guard ────────────────────────────────────
  useEffect(() => {
    if (!user || !token) {
      toast.error('Please log in.');
      navigate('/login');
    }
  }, []);

  // ── Fetch data ────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, qrRes, attendRes] = await Promise.allSettled([
          axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/auth/qrcode`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/attendance/member/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data.success) {
          setProfile(profileRes.value.data.data);
        }

        if (qrRes.status === 'fulfilled' && qrRes.value.data.success) {
          setQrCode(qrRes.value.data.data.qrCode);
        }

        if (attendRes.status === 'fulfilled' && attendRes.value.data.success) {
          setAttendance(attendRes.value.data.data.attendance || []);
          setTotalRecords(attendRes.value.data.data.totalRecords || 0);
        }
      } catch {
        toast.error('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAll();
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

  // ── Download QR ───────────────────────────────────
  const handleDownloadQr = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${profile?.firstName || 'member'}-qrcode.png`;
    link.click();
  };

  // ── Greeting ──────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Recent 5
  const recentAttendance = attendance.slice(0, 5);

  // This month count
  const now = new Date();
  const thisMonthCount = attendance.filter((a) => {
    const d = new Date(a.dateOfAttendance);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  if (loading) return <LoadingScreen message="Loading your dashboard" submessage="Fetching your attendance records..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Header ────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {greeting}, {profile?.firstName || user?.firstName || 'Member'} 
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Shield size={14} /> {profile?.cellName || user?.cellName || 'Member'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/profile"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Profile">
              <User size={20} className="text-gray-600 dark:text-gray-300" />
            </Link>
            <button onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition" title="Logout">
              <LogOut size={20} className="text-red-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Stats ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatsCard
            title="Total Attendance"
            value={totalRecords}
            icon={CalendarCheck}
            color="blue"
          />
          <StatsCard
            title="This Month"
            value={thisMonthCount}
            icon={Calendar}
            color="green"
          />
          <StatsCard
            title="Cell Group"
            value={profile?.cellName || '—'}
            icon={Shield}
            color="purple"
            subtitle="Active member"
          />
        </div>

        {/* ── QR Code card ─────────────────────────────── */}
        <Card title="My QR Code" icon={QrCode}
          action={
            qrCode && (
              <button onClick={handleDownloadQr}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <Download size={14} /> Download
              </button>
            )
          }>
          <div className="flex flex-col items-center py-4">
            {qrCode ? (
              <>
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  <img src={qrCode} alt="Your QR Code" className="w-48 h-48 object-contain" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Show this QR code to the usher when attending service
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <QrCode size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500">QR code not available</p>
                <p className="text-xs text-gray-400 mt-1">Please contact an administrator</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Quick actions ────────────────────────────── */}
        <Link to="/profile"
          className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-5 rounded-xl shadow transition transform hover:scale-[1.02]">
          <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
            <User size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white">My Profile</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">View & update your information</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </Link>

        {/* ── Recent attendance ─────────────────────────── */}
        <Card title="Recent Attendance" icon={CalendarCheck}>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <CalendarCheck size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No attendance records yet</p>
              <p className="text-sm mt-1">Your attendance will appear here after check-in</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentAttendance.map((rec, i) => {
                const date = new Date(rec.dateOfAttendance);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <li key={rec.id || i} className="flex items-center gap-3 py-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {dayName}, {dateStr}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> Checked in at {rec.checkInTime?.slice(0, 5)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {attendance.length > 5 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
              <Link to="/profile" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View full history →
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
