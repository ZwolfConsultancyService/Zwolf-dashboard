import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, className = '', required, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        required={required}
        className={`
          w-full
          rounded-lg
          border
          bg-white
          px-3.5
          py-2.5
          text-sm
          text-gray-900
          outline-none
          transition-all
          duration-200

          placeholder:text-gray-400

          ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : `
                border-gray-300
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
                focus:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]
              `
          }

          disabled:cursor-not-allowed
          disabled:bg-gray-50
          disabled:text-gray-500
          disabled:hover:border-gray-300

          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = 'Input';

export default Input;