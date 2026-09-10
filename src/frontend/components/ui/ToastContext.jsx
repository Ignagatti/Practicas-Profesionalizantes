import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = "", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, title = "Éxito", duration) => addToast("success", msg, title, duration),
    error: (msg, title = "Error", duration = 5000) => addToast("error", msg, title, duration),
    warning: (msg, title = "Atención", duration) => addToast("warning", msg, title, duration),
    info: (msg, title = "Información", duration) => addToast("info", msg, title, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Container de Toasts Flotantes */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe ser utilizado dentro de un ToastProvider");
  }
  return context;
}

function ToastItem({ toast, onClose }) {
  const { type, message, title } = toast;

  const config = {
    success: {
      icon: CheckCircle2,
      bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
      iconColor: "text-emerald-600",
      barBg: "bg-emerald-500",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-red-50 border-red-300 text-red-900",
      iconColor: "text-red-600",
      barBg: "bg-red-500",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-50 border-amber-300 text-amber-900",
      iconColor: "text-amber-600",
      barBg: "bg-amber-500",
    },
    info: {
      icon: Info,
      bg: "bg-blue-50 border-blue-300 text-blue-900",
      iconColor: "text-blue-600",
      barBg: "bg-blue-500",
    },
  };

  const current = config[type] || config.info;
  const Icon = current.icon;

  return (
    <div
      className={`pointer-events-auto shadow-xl rounded-2xl border p-4 flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-4 fade-in backdrop-blur-md ${current.bg}`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-bold leading-none mb-1">{title}</h4>}
        <p className="text-xs text-gray-700 leading-relaxed break-words">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
