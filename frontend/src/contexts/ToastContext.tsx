'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fcd34d', color: '#d97706' },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#2563eb' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast]);
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast]);
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto max-w-sm w-full animate-in"
              style={{ background: s.bg, borderColor: s.border }}
            >
              <Icon size={16} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
              <p className="flex-1 text-sm font-medium" style={{ color: s.color }}>{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: s.color }}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
