import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 min-w-[280px] max-w-md p-4 rounded-lg shadow-lg text-white ${
              t.type === 'success' ? 'bg-green-600'
                : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800'
            }`}
          >
            {t.type === 'success' ? <CheckCircle size={20} />
              : t.type === 'error' ? <XCircle size={20} /> : <Info size={20} />}
            <span className="flex-1 text-sm">{t.message}</span>
            <button onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);