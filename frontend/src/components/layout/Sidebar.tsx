'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, Settings, ChevronDown, Plus, X, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/dashboard/team', icon: Users, label: 'Team' },
  { href: '/dashboard/profile', icon: UserCircle, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex-shrink-0 shadow-lg lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs" style={{ background: 'var(--accent)' }}>
              <CheckSquare size={16} style={{ color: 'var(--accent-fg)' }} />
            </div>
            <span className="font-bold text-lg tracking-tight">AbleSpace</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-3.5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-2xs border" style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-glow)' }}>
            <span className="truncate">{user?.name?.split(' ')[0]}&apos;s Workspace</span>
            <ChevronDown size={14} className="opacity-80 flex-shrink-0 ml-1" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  active ? 'shadow-xs scale-[1.01]' : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                style={active
                  ? { background: 'var(--accent)', color: 'var(--accent-fg)' }
                  : { color: 'var(--text-muted)' }
                }
              >
                <Icon size={17} className={cn('transition-transform duration-150', active && 'scale-110')} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* New project button */}
        <div className="px-3.5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => {
              onClose();
              router.push('/dashboard/projects');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 border-dashed transition-all hover:bg-black/5 dark:hover:bg-white/5 hover:border-solid hover:scale-[0.99]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <Plus size={15} />
            New Project
          </button>
        </div>

        {/* User */}
        <div className="px-3.5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
