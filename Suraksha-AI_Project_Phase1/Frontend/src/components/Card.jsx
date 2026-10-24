import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  glow = false,
  onClick,
  ...props
}) => {
  const cardStyle = `metric-card p-4 flex flex-col justify-between ${
    onClick ? 'cursor-pointer hover:border-indigo-500 hover:shadow-md' : ''
  } ${className}`;

  return (
    <div className={cardStyle} onClick={onClick} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-custom/50">
          <div>
            {title && (
              <h3 className="text-[13px] font-bold text-text-custom tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-text-muted mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center space-x-2">{action}</div>}
        </div>
      )}
      <div className="text-text-custom text-[12px]">{children}</div>
    </div>
  );
};

export default Card;
