import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, MessageCircle, Users, Zap } from 'lucide-react';
import PublicHeader from '../components/PublicHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  useEffect(() => { if (!loading && isAuthenticated) navigate('/app', { replace: true }); }, [isAuthenticated, loading, navigate]);
  if (loading) return <LoadingScreen message="Loading" submessage="Preparing hackerRant…" />;

  return (
    <div className="hr-app-bg min-h-screen">
      <PublicHeader />
      <main className="hr-landing">
        <section className="hr-hero">
          <div className="hr-hero-copy">
            <div className="hr-kicker"><span className="hr-kicker-dot" /> YOUR PEOPLE. YOUR CONVERSATIONS.</div>
            <h1 className="prefFont">A place to <span>rant.</span><br />A space to connect.</h1>
            <p>Drop a thought, find your people, and keep the conversation going. hackerRant brings chats, threads, and community into one focused space.</p>
            <div className="hr-hero-actions"><Link to="/signup" className="hr-primary-cta">Join the conversation <ArrowUpRight size={17} /></Link><Link to="/login" className="hr-secondary-cta">Already a member? Log in</Link></div>
            <div className="hr-hero-trust"><ShieldCheck size={16} /><span>Security-minded sessions</span><span className="hr-trust-divider" /><span>Built for real conversations</span></div>
          </div>
          <div className="hr-preview-wrap" aria-label="Preview of the hackerRant interface">
            <div className="hr-preview-glow" />
            <div className="hr-preview glass-panel">
              <div className="hr-preview-head"><div className="hr-preview-brand"><img src="/hRLogo.jpg" alt="" /><span><strong>hackerRant</strong><small>COMMUNITY SPACE</small></span></div><span className="hr-preview-menu">•••</span></div>
              <div className="hr-preview-channel"><div className="hr-preview-channel-icon"><MessageCircle size={20} /></div><div><strong>The Lounge</strong><small>Good conversations start here.</small></div><span className="hr-channel-live"><i /> LIVE</span></div>
              <div className="hr-preview-message"><div className="hr-preview-avatar avatar-purple">N</div><div><div className="hr-preview-author">neo<span>10:42 AM</span></div><p>What’s one thing you wish more people understood about cybersecurity?</p><div className="hr-reaction">⌁ <b>12</b> <span>Reply</span></div></div></div>
              <div className="hr-preview-message"><div className="hr-preview-avatar avatar-red">S</div><div><div className="hr-preview-author">sly<span>10:44 AM</span></div><p>That security is a habit, not just a tool. The little things matter.</p><div className="hr-reaction">♡ <b>8</b> <span>Reply</span></div></div></div>
              <div className="hr-preview-compose"><span>Say something worthwhile...</span><span className="hr-compose-send">↑</span></div>
              <div className="hr-preview-foot"><span><i /> Private by design</span><span>01 / COMMUNITY</span></div>
            </div>
            <div className="hr-float-card"><div className="hr-float-icon"><Users size={17} /></div><span><strong>Find your people</strong><small>One conversation at a time</small></span><Zap size={16} className="hr-float-zap" /></div>
          </div>
        </section>
        <section className="hr-feature-row"><div><span className="hr-feature-icon"><MessageCircle size={19} /></span><strong>Conversations that flow</strong><p>Chats made to keep ideas moving.</p></div><div><span className="hr-feature-icon"><Users size={19} /></span><strong>Community, your way</strong><p>Threads and spaces for shared interests.</p></div><div><span className="hr-feature-icon"><ShieldCheck size={19} /></span><strong>Security in the details</strong><p>Thoughtful session and request protections.</p></div></section>
        <footer className="hr-landing-footer"><span>© hackerRant</span><span>Think freely. Connect thoughtfully.</span></footer>
      </main>
    </div>
  );
};
export default Home;
