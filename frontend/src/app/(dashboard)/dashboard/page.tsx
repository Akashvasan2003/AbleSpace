'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckSquare, FolderKanban, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState, ErrorState, PageSpinner } from '@/components/ui';
import { Project, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';
import { projectsApi, workspacesApi, getErrorMessage } from '@/lib/api';

const statCards = [
  { label: 'Total Tasks', icon: CheckSquare },
  { label: 'Projects', icon: FolderKanban },
  { label: 'In Progress', icon: Clock },
  { label: 'Completed', icon: TrendingUp },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  const load = async () => {
    setError('');
    try {
      const workspaces = await workspacesApi.list();
      let workspace = workspaces[0];
      if (!workspace) workspace = await workspacesApi.create('My Workspace');
      const data = await projectsApi.list({ workspaceId: workspace.id });
      const detailed = await Promise.all(data.map((project) => projectsApi.get(project.id)));
      setProjects(detailed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const tasks = useMemo(
    () => projects.flatMap((project) => (project.tasks || []).map((task) => ({ ...task, project }))),
    [projects],
  );
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const inProgress = tasks.filter((task) => task.status === 'doing').length;
  const dueSoon = tasks.filter((task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const due = new Date(task.dueDate).getTime();
    return due >= now && due <= now + 1000 * 60 * 60 * 24 * 7;
  }).length;

  const values = [tasks.length, projects.length, inProgress, completed];
  const captions = [
    `${dueSoon} due this week`,
    `${projects.filter((p) => p.status === 'active').length} active`,
    `${tasks.filter((t) => t.status === 'todo').length} waiting`,
    tasks.length ? `${Math.round((completed / tasks.length) * 100)}% done` : 'No tasks yet',
  ];

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Good morning, {user?.name?.split(' ')[0] || 'there'}</h2>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Here is what is happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, icon: Icon }, index) => (
          <div key={label} className="rounded-2xl p-4.5 border min-h-[132px] glass-panel glass-panel-hover" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-glow)' }}>
                <Icon size={17} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{values[index]}</p>
            <p className="text-[11px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{captions[index]}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden shadow-xs glass-panel" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-bold text-sm tracking-tight">Recent Tasks</h3>
          <Link href="/dashboard/tasks" className="text-xs font-bold hover:underline transition-all" style={{ color: 'var(--accent)' }}>View all</Link>
        </div>

        {recentTasks.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="No tasks yet"
            description="Create a project task to see activity here."
            action={{ label: 'Open Tasks', onClick: () => { router.push('/dashboard/tasks'); } }}
          />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentTasks.map((task) => {
              const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              return (
                <Link
                  key={task.id}
                  href={`/dashboard/projects/${task.projectId}`}
                  className="px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/50 dark:ring-black/50" style={{ background: status.color }} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
                      }}
                    >
                      {task.title}
                    </p>
                    <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{task.project?.name}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 border shadow-2xs" style={{ background: priority.color + '15', color: priority.color, borderColor: priority.color + '30' }}>
                    {priority.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
