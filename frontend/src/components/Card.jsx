/**
 * Card
 */

const Card = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <section className={`rounded-2xl border border-black/5 bg-white ${className}`}>
      {(title || subtitle || action) ? (
        <header className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4">
          <div>
            {title ? <h2 className="prefFont text-lg font-extrabold text-gray-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
};

export default Card;
