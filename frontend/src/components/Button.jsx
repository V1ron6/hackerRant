/**
 * Button
 * Reusable button with variants + loading state.
 */

import LoadingSpinner from './LoadingSpinner.jsx';

const variants = {
  primary: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200',
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  isLoading = false,
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={
        `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition ` +
        `${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ` +
        `${fullWidth ? 'w-full' : ''} ` +
        `${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'} ` +
        `${className}`
      }
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="text-current" />
      ) : (
        LeftIcon ? <LeftIcon size={18} /> : null
      )}
      <span>{children}</span>
      {!isLoading && RightIcon ? <RightIcon size={18} /> : null}
    </button>
  );
};

export default Button;
