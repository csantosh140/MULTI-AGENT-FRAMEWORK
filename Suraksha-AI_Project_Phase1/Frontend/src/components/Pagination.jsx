import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (start === 1) {
        end = 5;
      } else if (end === totalPages) {
        start = totalPages - 4;
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border-custom/50 px-2 ${className}`}>
      <div className="text-xs text-text-muted">
        {totalItems > 0 ? (
          <>
            Showing <span className="font-semibold text-text-custom">{startIdx}</span> to{' '}
            <span className="font-semibold text-text-custom">{endIdx}</span> of{' '}
            <span className="font-semibold text-text-custom">{totalItems}</span> records
          </>
        ) : (
          'No records found'
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-border-custom rounded-lg text-text-custom hover:bg-border-custom/30 disabled:opacity-40 disabled:hover:bg-transparent transition focus:outline-none"
          title="Previous Page"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        {getPages().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none ${
              currentPage === page
                ? 'bg-primary-custom text-white shadow-sm shadow-blue-500/20'
                : 'border border-border-custom text-text-custom hover:bg-border-custom/30'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-border-custom rounded-lg text-text-custom hover:bg-border-custom/30 disabled:opacity-40 disabled:hover:bg-transparent transition focus:outline-none"
          title="Next Page"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
