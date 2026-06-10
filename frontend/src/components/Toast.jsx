import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Toast.css';

const ToastContext = createContext(null);

let toastIdCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, opts = {}) => {
    const id = ++toastIdCounter;
    const toast = {
      id,
      message,
      kind: opts.kind || 'info',     // 'success' | 'error' | 'info' | 'warning'
      duration: opts.duration ?? 3800,
    };
    setToasts((list) => [...list, toast]);
    if (toast.duration > 0) {
      setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
  }, [dismiss]);

  // Convenience wrappers
  const api = {
    push,
    dismiss,
    success: (m, o) => push(m, { ...o, kind: 'success' }),
    error:   (m, o) => push(m, { ...o, kind: 'error' }),
    info:    (m, o) => push(m, { ...o, kind: 'info' }),
    warning: (m, o) => push(m, { ...o, kind: 'warning' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
};

const ToastViewport = ({ toasts, dismiss }) => {
  return (
    <div className="toast-viewport" role="region" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast toast-${t.kind}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            layout
          >
            <span className="toast-icon" aria-hidden>
              {t.kind === 'success' ? '✓' : t.kind === 'error' ? '!' : t.kind === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback — log to console rather than crash if Provider is missing.
    return {
      push: (m) => console.log('[toast]', m),
      success: (m) => console.log('[toast:success]', m),
      error:   (m) => console.error('[toast:error]', m),
      info:    (m) => console.log('[toast:info]', m),
      warning: (m) => console.warn('[toast:warning]', m),
      dismiss: () => {},
    };
  }
  return ctx;
};

export default ToastProvider;
