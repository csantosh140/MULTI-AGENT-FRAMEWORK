import React from 'react';
import { ResponsiveContainer } from 'recharts';
import Card from './Card';

const ChartWrapper = ({
  children,
  title,
  subtitle,
  action,
  height = 320,
  className = '',
  ...props
}) => {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      action={action}
      className={`flex flex-col ${className}`}
      {...props}
    >
      <div className="w-full mt-2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ChartWrapper;
