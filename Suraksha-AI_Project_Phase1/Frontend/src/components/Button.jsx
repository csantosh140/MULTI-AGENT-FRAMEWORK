import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#5243e8] hover:bg-[#4335d6] text-white shadow-xs',
    accent: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs',
    secondary: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2 text-[12px]',
    lg: 'px-5 py-2.5 text-[13px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && Icon && <Icon className="mr-1.5 text-sm" />}
      {children}
    </button>
  );
};

export default Button;
