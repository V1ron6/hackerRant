/** Inline status message (error / success / info) with the right ARIA role. */
const tones = {
  error: 'border-red-500/30 bg-red-500/10 !text-red-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 !text-emerald-300',
  info: 'border-white/10 bg-white/[0.04] !text-gray-300',
};

const Notice = ({ tone = 'info', children, className = '' }) =>
  children ? (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]} ${className}`}>
      {children}
    </p>
  ) : null;

export default Notice;
