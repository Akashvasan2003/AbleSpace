'use client';
import { LucideIcon } from 'lucide-react';

export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-t-transparent animate-spin"
      style={{
        width: size, height: size,
        borderColor: 'var(--accent)',
        borderTopColor: 'transparent',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center fade-in">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border"
        style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-glow)' }}
      >
        <Icon size={24} style={{ color: 'var(--accent)' }} />
      </div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        {description && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className="px-4 py-3 rounded-xl border text-sm text-red-600 flex items-center gap-2 max-w-md"
        style={{ background: '#fef2f2', borderColor: '#fca5a5' }}
        role="alert"
      >
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium"
          style={{ color: 'var(--accent)' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
