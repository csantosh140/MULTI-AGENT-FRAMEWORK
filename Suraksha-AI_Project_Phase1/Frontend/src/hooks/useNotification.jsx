import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <FiCheckCircle className="w-5 h-5 text-green-500" />,
    error: <FiAlertTriangle className="w-5 h-5 text-red-500" />,
    warning: <FiAlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <FiInfo className="w-5 h-5 text-cyan-500" />,
  };

  const borderColors = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-amber-500/30',
    info: 'border-cyan-500/30',
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-start justify-between p-4 bg-card-custom border ${borderColors[toast.type]} rounded-xl shadow-lg shadow-black/30 pointer-events-auto backdrop-blur-md theme-transition`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
                <div className="text-sm font-medium text-text-custom leading-tight">
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => removeNotification(toast.id)}
                className="flex-shrink-0 ml-4 p-0.5 text-text-muted hover:text-text-custom rounded-md hover:bg-border-custom/30 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
