/** Consistent page title block for the authenticated pages. */
const PageHeader = ({ title, subtitle, icon: Icon, children }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div className="min-w-0">
      <h1 className="prefFont flex items-center gap-2 text-2xl font-extrabold">
        {Icon ? <Icon size={22} className="shrink-0 text-red-400" /> : null}
        <span className="truncate">{title}</span>
      </h1>
      {subtitle ? <p className="mt-1 text-sm">{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

export default PageHeader;
