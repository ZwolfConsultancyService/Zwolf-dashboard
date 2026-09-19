export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`
        btn-base
        inline-flex
        items-center
        justify-center
        gap-2
        ${variants[variant] || variants.primary}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading && (
        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}

      <span>{children}</span>
    </button>
  );
}