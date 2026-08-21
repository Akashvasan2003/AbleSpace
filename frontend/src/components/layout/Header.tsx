'use client';
import { Menu, Sun, Moon, Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ColorTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

const colorThemes: { value: ColorTheme; label: string; color: string }[] = [
  { value: 'amber', label: 'Amber', color: '#f59e0b' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
  { value: 'rose', label: 'Rose', color: '#f43f5e' },
  { value: 'emerald', label: 'Emerald', color: '#10b981' },
  { value: 'black', label: 'Black', color: '#18181b' },
];

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title = 'Dashboard' }: HeaderProps) {
  const { logout, user } = useAuth();
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme();
  const [showThemes, setShowThemes] = useState(false);
  const [showUser, setShowUser] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between gap-3 px-4 sm:px-6 border-b flex-shrink-0 sticky top-0 z-20 backdrop-blur-md transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Menu size={19} />
        </button>
        <h1 className="font-bold text-base tracking-tight truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Search */}
        <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} title="Search">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative" style={{ color: 'var(--text-muted)' }} title="Notifications">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ background: 'var(--accent)' }} />
        </button>

        {/* Dark mode toggle */}
        <button onClick={toggleMode} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {mode === 'dark' ? <Sun size={18} className="text-amber-400 transition-transform duration-300 hover:rotate-45" /> : <Moon size={18} className="transition-transform duration-300 hover:-rotate-12" />}
        </button>

        {/* Color theme picker */}
        <div className="relative">
          <button
            onClick={() => { setShowThemes(!showThemes); setShowUser(false); }}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center"
            title="Color theme"
          >
            <div className="w-4 h-4 rounded-full ring-2 ring-white/30 dark:ring-black/30 shadow-xs transition-transform hover:scale-110" style={{ background: colorThemes.find(t => t.value === colorTheme)?.color }} />
          </button>
          {showThemes && (
            <div className="absolute right-0 top-12 z-50 p-3 rounded-2xl shadow-xl border w-52 fade-in modal-animate" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-semibold mb-2.5 px-1" style={{ color: 'var(--text-muted)' }}>Accent Color Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {colorThemes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setColorTheme(t.value); setShowThemes(false); }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150 border"
                    style={colorTheme === t.value
                      ? { background: 'var(--accent-light)', borderColor: 'var(--accent)' }
                      : { borderColor: 'transparent' }
                    }
                  >
                    <div className="w-5 h-5 rounded-full shadow-xs" style={{ background: t.color }} />
                    <span className="text-[11px] font-medium" style={{ color: colorTheme === t.value ? 'var(--accent)' : 'var(--text-muted)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative ml-1">
          <button
            onClick={() => { setShowUser(!showUser); setShowThemes(false); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-transform hover:scale-105"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </button>
          {showUser && (
            <div className="absolute right-0 top-12 z-50 rounded-2xl shadow-xl border w-52 overflow-hidden fade-in modal-animate" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium hover:bg-red-500/10 transition-colors text-red-500"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
