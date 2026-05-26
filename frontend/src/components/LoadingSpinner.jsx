/**
 * LoadingSpinner
 */

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-6 w-6 border-2',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  return (
    <span
      className={
        `inline-block animate-spin rounded-full border-current border-t-transparent ` +
        `${sizeMap[size] || sizeMap.md} ${className}`
      }
      aria-label="Loading"
    />
  );
};

export default LoadingSpinner;
