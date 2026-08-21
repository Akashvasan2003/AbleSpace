'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ColorTheme = 'amber' | 'blue' | 'pink' | 'rose' | 'emerald' | 'black';
export type Mode = 'light' | 'dark';

interface ThemeContextType {
  mode: Mode;
  colorTheme: ColorTheme;
  toggleMode: () => void;
  setColorTheme: (t: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const colorMap: Record<ColorTheme, string> = {
  amber: 'theme-amber',
  blue: 'theme-blue',
  pink: 'theme-pink',
  rose: 'theme-rose',
  emerald: 'theme-emerald',
  black: 'theme-black',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('mode') as Mode) || 'light';
  });
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window === 'undefined') return 'blue';
    return (localStorage.getItem('colorTheme') as ColorTheme) || 'blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    Object.values(colorMap).forEach((c) => root.classList.remove(c));
    root.classList.add(colorMap[colorTheme]);
    localStorage.setItem('mode', mode);
    localStorage.setItem('colorTheme', colorTheme);
  }, [mode, colorTheme]);

  const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  const setColorTheme = (t: ColorTheme) => setColorThemeState(t);

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, toggleMode, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
