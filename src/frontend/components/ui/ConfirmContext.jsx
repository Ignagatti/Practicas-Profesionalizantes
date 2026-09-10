import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, Trash2, HelpCircle, X } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Confirmar acción",
    message: "¿Está seguro que desea continuar?",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "danger", // 'danger' | 'warning' | 'info'
    resolve: null,
  });

  const confirm = useCallback(
    ({
      title = "Confirmar acción",
      message = "¿Está seguro que desea realizar esta acción?",
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      type = "danger",
    }) => {
      return new Promise((resolve) => {
        setModalState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          type,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {modalState.isOpen && (
        <ConfirmDialog
          modalState={modalState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm debe ser utilizado dentro de un ConfirmProvider");
  }
  return context;
}

function ConfirmDialog({ modalState, onConfirm, onCancel }) {
  const { title, message, confirmText, cancelText, type } = modalState;

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: "bg-red-100 text-red-700",
      btnBg: "bg-red-700 hover:bg-red-800 text-white focus:ring-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-700",
      btnBg: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    info: {
      icon: HelpCircle,
      iconBg: "bg-blue-100 text-blue-700",
      btnBg: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    },
  };

  const config = typeConfig[type] || typeConfig.danger;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-snug">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50/80 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.btnBg}`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
