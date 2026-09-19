import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <select ref={ref} className={`input-base bg-white ${error ? 'border-red-500' : ''} ${className}`} {...props}>
      {children}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
));

Select.displayName = 'Select';
export default Select;