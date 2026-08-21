'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal, Trash2, Edit2, FolderKanban, X, LayoutGrid, List, Calendar, Flag } from 'lucide-react';
import { Project, UserMin, PRIORITY_CONFIG, PROJECT_STATUS_CONFIG } from '@/types/task';
import ProjectModal from '@/components/projects/ProjectModal';
import { projectsApi, workspacesApi, getErrorMessage } from '@/lib/api';
import { EmptyState, ErrorState, PageSpinner } from '@/components/ui';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

function Avatar({ name, size = 24, color }: { name: string; size?: number; color?: string }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: color || 'var(--accent)' }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.color + '20', color: cfg.color }}>
      <Flag size={9} />{cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = PROJECT_STATUS_CONFIG[status] || PROJECT_STATUS_CONFIG.active;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');
  const [members, setMembers] = useState<UserMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const workspaces = await workspacesApi.list();
      let wsId = workspaceId;
      if (!wsId || !workspaces.some((w) => w.id === wsId)) {
        if (!workspaces.length) {
          const ws = await workspacesApi.create('My Workspace');
          wsId = ws.id;
        } else {
          wsId = workspaces[0].id;
        }
        setWorkspaceId(wsId);
      }
      const [projectData, wsDetail] = await Promise.all([
        projectsApi.list({ workspaceId: wsId }),
        workspacesApi.get(wsId),
      ]);
      setProjects(projectData);
      setMembers(wsDetail.members?.map((m) => m.user) || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      const p = await projectsApi.create({ ...(data as Parameters<typeof projectsApi.create>[0]), workspaceId });
      setProjects(prev => [p, ...prev]);
      toast.success('Project created');
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editProject) return;
    try {
      const p = await projectsApi.update(editProject.id, data);
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, ...p } : x));
      toast.success('Project updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await projectsApi.remove(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setMenuOpen(null);
      setDeleteProject(null);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const filtered = projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterPriority && p.priority !== filterPriority) return false;
    return true;
  });

  const activeFilters = [filterStatus, filterPriority].filter(Boolean).length;

  const getProgress = (p: Project) => {
    const tasks = (p as Project & { tasks?: { status: string }[] }).tasks;
    if (!tasks?.length) return 0;
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  };

  const getTaskCount = (p: Project) => (p as Project & { tasks?: unknown[] }).tasks?.length ?? p._count?.tasks ?? 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="pl-8 pr-8 py-1.5 rounded-lg border text-sm outline-none w-full sm:w-44"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}><X size={12} /></button>}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilter(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: activeFilters ? 'var(--accent)' : 'var(--border)', background: activeFilters ? 'var(--accent-light)' : 'var(--bg-card)', color: activeFilters ? 'var(--accent)' : 'var(--text-muted)' }}>
              <Filter size={13} />Filter{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-9 z-20 w-52 rounded-xl shadow-lg border p-3 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PROJECT_STATUS_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterStatus(s => s === k ? '' : k)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={filterStatus === k ? { background: v.color, color: '#fff', borderColor: v.color } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterPriority(s => s === k ? '' : k)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={filterPriority === k ? { background: v.color, color: '#fff', borderColor: v.color } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button onClick={() => { setFilterStatus(''); setFilterPriority(''); }} className="text-xs w-full text-center" style={{ color: 'var(--accent)' }}>Clear filters</button>
                )}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setView('grid')} className="p-1.5 transition-colors"
              style={{ background: view === 'grid' ? 'var(--accent)' : 'var(--bg-card)', color: view === 'grid' ? 'var(--accent-fg)' : 'var(--text-muted)' }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('table')} className="p-1.5 transition-colors"
              style={{ background: view === 'table' ? 'var(--accent)' : 'var(--bg-card)', color: view === 'table' ? 'var(--accent-fg)' : 'var(--text-muted)' }}>
              <List size={15} />
            </button>
          </div>

          <button onClick={() => { setEditProject(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <Plus size={15} /><span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={search || activeFilters ? 'Try changing your search or filters.' : 'Create a project to organize related tasks.'}
          action={{ label: 'Create Project', onClick: () => { setEditProject(null); setModalOpen(true); } }}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => {
            const progress = getProgress(project);
            const taskCount = getTaskCount(project);
            return (
              <div key={project.id} className="rounded-lg border p-5 cursor-pointer hover:shadow-md transition-all group relative min-h-[190px]"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: project.color + '22' }}>
                      <FolderKanban size={18} style={{ color: project.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === project.id ? null : project.id); }}
                    className="p-1 rounded hover:opacity-70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--text-muted)' }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {project.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
                )}

                <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[24px]">
                  <PriorityBadge priority={project.priority} />
                  {project.dueDate && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={10} />{new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {project.lead && (
                    <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                      <Avatar name={project.lead.name} size={16} />
                      {project.lead.name.split(' ')[0]}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: project.color }} />
                  </div>
                </div>

                {/* Context menu */}
                {menuOpen === project.id && (
                  <div className="absolute right-3 top-12 z-20 rounded-xl shadow-lg border overflow-hidden w-36"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditProject(project); setModalOpen(true); setMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:opacity-70">
                      <Edit2 size={13} />Edit
                    </button>
                    <button onClick={() => setDeleteProject(project)}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-500 hover:opacity-70">
                      <Trash2 size={13} />Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add card */}
          <button onClick={() => { setEditProject(null); setModalOpen(true); }}
            className="rounded-lg border-2 border-dashed p-5 flex flex-col items-center justify-center gap-2 hover:opacity-70 transition-opacity min-h-[190px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Plus size={22} /><span className="text-sm font-medium">New Project</span>
          </button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Project', 'Status', 'Priority', 'Lead', 'Due Date', 'Tasks', 'Progress', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((project, i) => {
                  const progress = getProgress(project);
                  const taskCount = getTaskCount(project);
                  return (
                    <tr key={project.id}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: project.color + '22' }}>
                            <FolderKanban size={14} style={{ color: project.color }} />
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            {project.description && <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={project.priority} /></td>
                      <td className="px-4 py-3">
                        {project.lead ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={project.lead.name} size={22} />
                            <span className="text-xs">{project.lead.name.split(' ')[0]}</span>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {project.dueDate
                          ? <span className="text-xs">{new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{taskCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: project.color }} />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditProject(project); setModalOpen(true); }}
                            className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}><Edit2 size={13} /></button>
                          <button onClick={() => setDeleteProject(project)}
                            className="p-1.5 rounded hover:opacity-70 text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProject(null); }}
        onSave={editProject ? handleUpdate : handleCreate}
        project={editProject}
        workspaceId={workspaceId}
        members={members}
      />
      <ConfirmDialog
        open={Boolean(deleteProject)}
        title="Delete Project"
        message="This will permanently delete the project and all tasks inside it."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={() => deleteProject && handleDelete(deleteProject.id)}
        onCancel={() => setDeleteProject(null)}
      />
    </div>
  );
}
