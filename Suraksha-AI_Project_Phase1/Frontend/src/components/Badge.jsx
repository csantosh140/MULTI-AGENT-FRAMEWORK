import React from 'react';

const Badge = ({ children, variant = 'info', className = '', ...props }) => {
  const baseStyle = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors';
  
  const variants = {
    critical: 'bg-red-50 text-red-600 border-red-100',
    high: 'bg-orange-50 text-orange-600 border-orange-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    low: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    info: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const key = children?.toString().toLowerCase();
  const currentVariant = variants[key] || variants[variant] || variants.info;

  return (
    <span className={`${baseStyle} ${currentVariant} ${className}`} {...props}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {children}
    </span>
  );
};

export default Badge;
