import { Link } from 'react-router-dom';
const PublicHeader = () => <header className="hr-public-header glass-panel"><div className="hr-public-header-inner"><Link to="/" className="hr-public-brand"><img src="/hRLogo.jpg" alt="" /><span><strong className="prefFont">hackerRant</strong><small>secure realtime community</small></span></Link><nav className="hr-public-nav" aria-label="Public navigation"><Link to="/login">Log in</Link><Link className="hr-public-join" to="/signup">Get started <span>↗</span></Link></nav></div></header>;
export default PublicHeader;
