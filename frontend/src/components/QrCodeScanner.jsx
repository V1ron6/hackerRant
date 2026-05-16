import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, X, ScanLine } from 'lucide-react';

/**
 * ========================================
 * QR Code Scanner Component
 * ========================================
 *
 * Scans QR codes using the device camera via html5-qrcode.
 *
 * Props:
 * - onScan: (decodedText: string, result: object) => void — called on successful scan
 * - onError: (error: string) => void — optional error callback
 * - onClose: () => void — optional close/dismiss callback
 * - width: number — scanner width in px (default: 300)
 * - height: number — scanner height in px (default: 300)
 * - fps: number — frames per second (default: 10)
 * - qrbox: number — size of the scanning box (default: 250)
 * - disableFlip: boolean — disable image flip (default: false)
 * - facingMode: 'environment' | 'user' — camera to use (default: 'environment')
 * - showOverlay: boolean — show scan overlay UI (default: true)
 * - autoClose: boolean — auto close after successful scan (default: false)
 *
 * Example:
 * <QrCodeScanner
 *   onScan={(text) => console.log('Scanned:', text)}
 *   onClose={() => setShowScanner(false)}
 * />
 */

const QrCodeScanner = ({
  onScan,
  onError,
  onClose,
  width = 300,
  height = 300,
  fps = 10,
  qrbox = 250,
  disableFlip = false,
  facingMode = 'environment',
  showOverlay = true,
  autoClose = false,
}) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [cameraList, setCameraList] = useState([]);
  const [activeCamera, setActiveCamera] = useState(facingMode);

  const scannerId = 'qr-code-scanner-region';

  // ── Start scanner ──────────────────────────────────
  const startScanner = async () => {
    setError('');
    setScanResult(null);

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        const msg = 'No cameras found on this device.';
        setError(msg);
        onError?.(msg);
        return;
      }
      setCameraList(cameras);

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: activeCamera },
        { fps, qrbox: { width: qrbox, height: qrbox }, disableFlip },
        (decodedText, decodedResult) => {
          setScanResult(decodedText);
          onScan?.(decodedText, decodedResult);
          if (autoClose) stopScanner();
        },
        () => {} // ignore per-frame errors
      );

      setIsScanning(true);
    } catch (err) {
      const msg = err?.message || 'Failed to start camera. Please allow camera access.';
      setError(msg);
      onError?.(msg);
    }
  };

  // ── Stop scanner ───────────────────────────────────
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
    } catch {
      // ignore cleanup errors
    }
    setIsScanning(false);
  };

  // ── Toggle camera ─────────────────────────────────
  const toggleCamera = async () => {
    await stopScanner();
    setActiveCamera((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Restart scanner when camera changes
  useEffect(() => {
    if (isScanning || scanResult) return;
    // small delay so DOM is ready
    const timer = setTimeout(() => startScanner(), 200);
    return () => clearTimeout(timer);
  }, [activeCamera]);

  // ── Cleanup on unmount ─────────────────────────────
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Camera size={20} /> QR Scanner
        </h3>
        {onClose && (
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Close scanner"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Scanner viewport */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ maxWidth: width }}>
        <div id={scannerId} style={{ width: '100%' }} />

        {/* Overlay animation */}
        {showOverlay && isScanning && !scanResult && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[250px] h-[250px] relative">
              {/* Corner brackets */}
              <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              {/* Scanning line */}
              <div className="absolute left-2 right-2 h-0.5 bg-green-400 opacity-80 animate-bounce" style={{ top: '50%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 w-full p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Scan result */}
      {scanResult && (
        <div className="mt-3 w-full p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Scanned successfully</p>
          <p className="text-sm text-green-800 dark:text-green-200 break-all font-mono">{scanResult}</p>
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <Camera size={16} /> Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition"
          >
            <CameraOff size={16} /> Stop
          </button>
        )}

        {cameraList.length > 1 && (
          <button
            onClick={toggleCamera}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium rounded-lg transition"
            title="Switch camera"
          >
            <RefreshCw size={16} /> Flip
          </button>
        )}

        {scanResult && (
          <button
            onClick={() => { setScanResult(null); startScanner(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
          >
            <RefreshCw size={16} /> Scan Again
          </button>
        )}
      </div>
    </div>
  );
};

export default QrCodeScanner;
