import { AlertCircle, Clock, LogOut, RotateCcw } from 'lucide-react';

/**
 * SessionWarning Component
 * Displays session timeout warning modal with countdown timer
 */
const SessionWarning = ({ 
	isVisible, 
	timeRemaining, 
	onContinueSession, 
	onLogout 
}) => {
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	if (!isVisible) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" />

			{/* Modal */}
			<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
				<div className="relative max-w-md w-full overflow-hidden rounded-2xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/35 animate-in fade-in slide-in-from-center duration-300">
					<div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-300/30 blur-2xl" />
					<div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />
					{/* Header */}
					<div className="relative flex items-center gap-3 px-6 py-4 border-b border-white/25 bg-linear-to-r from-amber-500/80 to-orange-500/75">
						<AlertCircle className="w-6 h-6 text-white" />
						<h2 className="text-xl font-bold text-white">Session Timeout Warning</h2>
					</div>

					{/* Content */}
					<div className="relative p-6 space-y-4">
						<p className="text-slate-900/90 dark:text-slate-100/90 text-base">
							Your session is about to expire due to inactivity. You will be automatically logged out in:
						</p>

						{/* Timer Display */}
						<div className="rounded-xl border border-amber-200/60 bg-amber-50/65 p-4 text-center shadow-inner backdrop-blur-sm dark:border-amber-300/25 dark:bg-slate-800/55">
							<div className="flex items-center justify-center gap-2 mb-2">
								<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
								<span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
									Time Remaining
								</span>
							</div>
							<div className="text-4xl font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wide">
								{formatTime(timeRemaining)}
							</div>
						</div>

						<p className="text-sm text-slate-700/90 dark:text-slate-300/90 text-center">
							Click "Continue Session" to stay logged in or you will be logged out automatically.
						</p>
					</div>

					{/* Actions */}
					<div className="relative flex gap-3 p-6 border-t border-white/25 bg-white/25 dark:bg-slate-900/30">
						<button
							onClick={onLogout}
							className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white font-medium rounded-xl border border-red-300/40 shadow-sm transition-colors duration-200"
						>
							<LogOut className="w-4 h-4" />
							Logout Now
						</button>
						<button
							onClick={onContinueSession}
							className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-white font-medium rounded-xl border border-emerald-300/40 shadow-sm transition-colors duration-200"
						>
							<RotateCcw className="w-4 h-4" />
							Continue Session
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default SessionWarning;
