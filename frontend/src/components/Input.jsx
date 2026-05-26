/**
 * Input
 * Labeled input with optional icon + error.
 */

const Input = ({
  label,
  hint,
  error,
  icon: Icon,
  className = '',
  inputClassName = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label ? <label className="mb-1 block text-sm font-semibold text-gray-800">{label}</label> : null}
      <div className="relative">
        {Icon ? <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> : null}
        <input
          {...props}
          className={
            `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition ` +
            `${Icon ? 'pl-10' : ''} ` +
            `${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'} ` +
            `${inputClassName}`
          }
        />
      </div>
      {error ? <div className="mt-1 text-sm font-semibold text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
};

export default Input;
