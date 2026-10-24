import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBox = ({
  value,
  onChange,
  placeholder = 'Search vulnerabilities...',
  className = '',
  onClear,
}) => {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
        <FiSearch className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-bg-custom border border-border-custom rounded-lg text-sm text-text-custom placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-custom focus:border-accent-custom theme-transition"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-muted hover:text-text-custom focus:outline-none"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBox;
