import { Outlet } from 'react-router-dom';
import { SessionProvider, useSession } from '../context';
import SessionWarning from './SessionWarning';
import AppWrapper from './AppWrapper';
import { ToastProvider } from './Toast';

/**
 * Inner component that uses session context
 */
const RootLayoutInner = () => {
	const { showSessionWarning, timeRemaining, continueSession, performLogout } = useSession();

	return (
		<AppWrapper>
			<Outlet />
			<SessionWarning 
				isVisible={showSessionWarning}
				timeRemaining={timeRemaining}
				onContinueSession={continueSession}
				onLogout={performLogout}
			/>
		</AppWrapper>
	);
};

/**
 * RootLayout Component
 * Main layout wrapper for the entire application
 * Handles session management UI
 */
const RootLayout = () => {
	return (
		<ToastProvider>
			<SessionProvider>
				<RootLayoutInner />
			</SessionProvider>
		</ToastProvider>
	);
};

export default RootLayout;
