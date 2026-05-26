import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import PublicHeader from '../components/PublicHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

const Home = () => {
	const navigate = useNavigate();
	const { isAuthenticated, loading } = useAuth();

	useEffect(() => {
		// buildi.txt: visiting base URL auto-validates ticket and routes user to chat home.
		if (!loading && isAuthenticated) {
			navigate('/app', { replace: true });
		}
	}, [isAuthenticated, loading, navigate]);

	if (loading) {
		return <LoadingScreen message="Loading" submessage="Preparing hackerRant…" />;
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-red-50 to-white">
			<PublicHeader />
			<main className="mx-auto max-w-6xl px-4 py-10">
				<div className="grid items-center gap-10 md:grid-cols-2">
					<section>
						<h1 className="prefFont text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">
							Secure realtime chat,
							<br />
							built for hackers.
						</h1>
						<p className="mt-4 text-gray-700">
							hackerRant is a WhatsApp-like web app with a security-first ticket model.
							Authentication lives in `hr_ticket` httpOnly cookies (API_DOCS.md).
						</p>

						<div className="mt-6 flex gap-3">
							<Link
								to="/signup"
								className="rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600"
							>
								Create account
							</Link>
							<Link
								to="/login"
								className="rounded-lg border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
							>
								Login
							</Link>
						</div>

						<div className="mt-8 grid gap-3 text-sm text-gray-700">
							<div className="rounded-xl border border-black/5 bg-white/70 p-4">
								<div className="font-semibold">Aggressor verification</div>
								<div className="text-gray-600">A background verifier checks your ticket periodically (buildi.txt).</div>
							</div>
							<div className="rounded-xl border border-black/5 bg-white/70 p-4">
								<div className="font-semibold">CSRF-protected mutations</div>
								<div className="text-gray-600">Mutations require `x-csrf-token` from `hr_csrf` (API_DOCS.md).</div>
							</div>
						</div>
					</section>

					<section className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm">
						<div className="flex items-center gap-4">
							<img src="/hRLogo.jpg" alt="hackerRant" className="h-16 w-16 rounded-2xl object-cover" />
							<div>
								<div className="prefFont text-2xl font-extrabold">hackerRant</div>
								<div className="text-sm text-gray-600">Realtime chat • Status • Threads • Finder</div>
							</div>
						</div>
						<div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-700">
							<div className="font-semibold">Note (-;)</div>
							<div className="mt-1 text-gray-600">
								Registration includes extra fields + VPN/IP checks. Frontend will capture fields now;
								backend endpoints for full flow are specified in REQUIRED_ENDPOINTS.md.
							</div>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
};

export default Home;