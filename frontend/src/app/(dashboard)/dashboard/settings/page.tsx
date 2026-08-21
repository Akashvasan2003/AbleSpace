'use client';
import { useTheme, ColorTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, Check, Palette, User } from 'lucide-react';
import Link from 'next/link';

const COLOR_THEMES: { value: ColorTheme; label: string; color: string; dark: string }[] = [
  { value: 'amber',   label: 'Amber',   color: '#f59e0b', dark: '#d97706' },
  { value: 'blue',    label: 'Blue',    color: '#3b82f6', dark: '#2563eb' },
  { value: 'pink',    label: 'Pink',    color: '#ec4899', dark: '#db2777' },
  { value: 'rose',    label: 'Rose',    color: '#f43f5e', dark: '#e11d48' },
  { value: 'emerald', label: 'Emerald', color: '#10b981', dark: '#059669' },
  { value: 'black',   label: 'Black',   color: '#18181b', dark: '#09090b' },
];

export default function SettingsPage() {
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your app preferences</p>
      </div>

      {/* Profile quick link */}
      <Link href="/dashboard/profile"
        className="flex flex-col gap-3 p-4 rounded-lg border hover:opacity-80 transition-opacity sm:flex-row sm:items-center sm:justify-between"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--accent)' }}>
          <User size={14} />Edit Profile
        </div>
      </Link>

      {/* Appearance */}
      <div className="rounded-lg border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Palette size={16} style={{ color: 'var(--accent)' }} />
          <h3 className="font-semibold">Appearance</h3>
        </div>

        {/* Theme mode */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Theme Mode</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
              { value: 'dark',  label: 'Dark',  icon: Moon, desc: 'Easy on the eyes' },
            ] as const).map(({ value, label, icon: Icon, desc }) => (
              <button key={value} onClick={() => mode !== value && toggleMode()}
                className="flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all"
                style={mode === value
                  ? { borderColor: 'var(--accent)', background: 'var(--accent-light)' }
                  : { borderColor: 'var(--border)', background: 'var(--bg)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: mode === value ? 'var(--accent)' : 'var(--border)' }}>
                  <Icon size={16} style={{ color: mode === value ? 'var(--accent-fg)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                {mode === value && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <Check size={11} color="white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Color theme */}
        <div>
          <p className="text-sm font-medium mb-3">Accent Color</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {COLOR_THEMES.map(t => (
              <button key={t.value} onClick={() => setColorTheme(t.value)}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all relative"
                style={colorTheme === t.value
                  ? { borderColor: t.color, background: t.color + '15' }
                  : { borderColor: 'var(--border)', background: 'var(--bg)' }}>
                {/* Color swatch */}
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: t.color }} />
                <span className="text-xs font-medium"
                  style={{ color: colorTheme === t.value ? t.color : 'var(--text-muted)' }}>
                  {t.label}
                </span>
                {colorTheme === t.value && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: t.color }}>
                    <Check size={9} color="white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Theme preference is saved automatically and persists after refresh.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="font-semibold mb-4 text-sm">Preview</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              Outline Button
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Tag 1', 'Tag 2', 'Tag 3'].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                {tag}
              </span>
            ))}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full w-3/5" style={{ background: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
