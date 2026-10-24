import React from 'react';
import { FiCheckCircle, FiSlash, FiEye } from 'react-icons/fi';

const StatusChip = ({ status, className = '' }) => {
  const normalized = status?.toLowerCase() || 'allowed';

  const styles = {
    blocked: {
      bg: 'bg-red-50 text-red-600 border-red-100',
      icon: FiSlash,
      label: 'Blocked',
    },
    allowed: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: FiCheckCircle,
      label: 'Allowed',
    },
    logged: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: FiEye,
      label: 'Logged',
    },
  };

  const current = styles[normalized] || styles.allowed;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${current.bg} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusChip;
