/**
 * Textarea
 */

const Textarea = ({
  label,
  hint,
  error,
  className = '',
  textareaClassName = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label ? <label className="mb-1 block text-sm font-semibold text-gray-800">{label}</label> : null}
      <textarea
        {...props}
        className={
          `w-full min-h-28 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition ` +
          `${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'} ` +
          `${textareaClassName}`
        }
      />
      {error ? <div className="mt-1 text-sm font-semibold text-red-600">{error}</div> : null}
      {!error && hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
};

export default Textarea;
