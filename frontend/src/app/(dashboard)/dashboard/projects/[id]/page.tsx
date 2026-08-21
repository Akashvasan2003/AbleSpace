'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, LayoutGrid, List, Search, Filter, SlidersHorizontal, X, Edit2, Calendar, Flag, FolderKanban } from 'lucide-react';
import { Task, Project, Label, UserMin, PRIORITY_CONFIG, STATUS_CONFIG, PROJECT_STATUS_CONFIG } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import BoardView from '@/components/tasks/BoardView';
import ListView from '@/components/tasks/ListView';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetail from '@/components/tasks/TaskDetail';
import ProjectModal from '@/components/projects/ProjectModal';
import { projectsApi, getErrorMessage } from '@/lib/api';
import { Spinner } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';

const DEFAULT_FIELDS = { priority: true, dueDate: true, assignee: true, labels: true, comments: true, subtasks: true };

function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, background: colors[name.charCodeAt(0) % colors.length] }}>
      {name[0].toUpperCase()}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { createTask, updateTask, fetchProject, createLabel } = useTasks();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFields, setShowFields] = useState(DEFAULT_FIELDS);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalStatus, setTaskModalStatus] = useState('todo');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setError('');
    const p = await fetchProject(id);
    if (p) { setProject(p); setTasks(p.tasks); }
    else setError('Project not found or could not be loaded');
    setLoading(false);
  }, [id, fetchProject]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fieldsRef.current && !fieldsRef.current.contains(e.target as Node)) setShowFieldsMenu(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const members: UserMin[] = project?.workspace?.members.map(m => m.user) || [];
  const labels: Label[] = project?.labels || [];

  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const handleCreateTask = async (data: Record<string, unknown>) => {
    const task = await createTask({ ...(data as Parameters<typeof createTask>[0]), projectId: id });
    if (task) {
      setTasks(prev => [...prev, task]);
      toast.success('Task created');
    } else {
      toast.error('Could not create task');
    }
  };

  const handleUpdateTask = async (taskId: string, data: Record<string, unknown>) => {
    const task = await updateTask(taskId, data);
    if (task) setTasks(prev => prev.map(t => t.id === taskId ? task : t));
    else toast.error('Could not update task');
  };

  const handleUpdateProject = async (data: Record<string, unknown>) => {
    try {
      const p = await projectsApi.update(id, data);
      setProject(prev => prev ? { ...prev, ...p } : prev);
      toast.success('Project updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleLabelCreate = async (name: string, color: string): Promise<Label | null> => {
    const label = await createLabel(id, name, color);
    if (label) setProject(prev => prev ? { ...prev, labels: [...prev.labels, label] } : prev);
    return label;
  };

  const activeFilters = [filterPriority, filterStatus].filter(Boolean).length;
  const statusCfg = project ? PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.active : null;
  const priorityCfg = project ? PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium : null;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p style={{ color: 'var(--text-muted)' }}>Project not found</p>
        <button onClick={() => router.push('/dashboard/projects')} className="text-sm" style={{ color: 'var(--accent)' }}>← Back to Projects</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-[1600px] mx-auto gap-4">
      {/* Project header */}
      <div className="flex-shrink-0 space-y-3">
        <button onClick={() => router.push('/dashboard/projects')}
          className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />Back to Projects
        </button>

        <div className="rounded-lg border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: project.color + '22' }}>
                <FolderKanban size={20} style={{ color: project.color }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">{project.name}</h2>
                {project.description && <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
              </div>
            </div>
            <button onClick={() => setProjectModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm flex-shrink-0 hover:opacity-70 sm:justify-start"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Edit2 size={13} />Edit
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {statusCfg && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: statusCfg.bg, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            )}
            {priorityCfg && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: priorityCfg.color + '20', color: priorityCfg.color }}>
                <Flag size={10} />{priorityCfg.label}
              </span>
            )}
            {project.dueDate && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={11} />{new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {project.lead && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Avatar name={project.lead.name} size={18} />
                {project.lead.name}
              </span>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{completedCount}/{tasks.length} tasks - {progress}%</span>
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: project.color }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4 flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold">Tasks</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{filteredTasks.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap xl:justify-end">
          <div className="relative w-full sm:w-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="pl-8 pr-8 py-1.5 rounded-lg border text-sm outline-none w-full sm:w-44"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}><X size={11} /></button>}
          </div>

          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilterMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: activeFilters ? 'var(--accent)' : 'var(--border)', background: activeFilters ? 'var(--accent-light)' : 'var(--bg-card)', color: activeFilters ? 'var(--accent)' : 'var(--text-muted)' }}>
              <Filter size={13} />Filter{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-9 z-20 w-52 rounded-xl shadow-lg border p-3 space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterPriority(p => p === k ? '' : k)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={filterPriority === k ? { background: v.color, color: '#fff', borderColor: v.color } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterStatus(p => p === k ? '' : k)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={filterStatus === k ? { background: v.color, color: '#fff', borderColor: v.color } : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && <button onClick={() => { setFilterPriority(''); setFilterStatus(''); }} className="text-xs w-full text-center" style={{ color: 'var(--accent)' }}>Clear</button>}
              </div>
            )}
          </div>

          <div className="relative" ref={fieldsRef}>
            <button onClick={() => setShowFieldsMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
              <SlidersHorizontal size={13} />Fields
            </button>
            {showFieldsMenu && (
              <div className="absolute right-0 top-9 z-20 w-44 rounded-xl shadow-lg border p-2" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {Object.entries(showFields).map(([field, visible]) => (
                  <button key={field} onClick={() => setShowFields(p => ({ ...p, [field]: !p[field as keyof typeof p] }))}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:opacity-80 capitalize">
                    <span style={{ color: 'var(--text)' }}>{field}</span>
                    <div className="w-8 h-4 rounded-full relative flex-shrink-0" style={{ background: visible ? 'var(--accent)' : 'var(--border)' }}>
                      <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: visible ? '17px' : '2px' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setView('board')} className="p-1.5 transition-colors"
              style={{ background: view === 'board' ? 'var(--accent)' : 'var(--bg-card)', color: view === 'board' ? 'var(--accent-fg)' : 'var(--text-muted)' }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('list')} className="p-1.5 transition-colors"
              style={{ background: view === 'list' ? 'var(--accent)' : 'var(--bg-card)', color: view === 'list' ? 'var(--accent-fg)' : 'var(--text-muted)' }}>
              <List size={15} />
            </button>
          </div>

          <button onClick={() => { setEditingTask(null); setTaskModalStatus('todo'); setTaskModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <Plus size={15} /><span className="hidden sm:inline">New Task</span>
          </button>
          </div>
        </div>
      </div>

      {/* Tasks content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${view === 'board' ? 'flex' : 'flex flex-col'}`}>
        {view === 'board' ? (
          <BoardView tasks={filteredTasks} onTaskClick={t => setDetailTaskId(t.id)} onEditTask={t => { setEditingTask(t); setTaskModalOpen(true); }}
            onAddTask={s => { setEditingTask(null); setTaskModalStatus(s); setTaskModalOpen(true); }}
            onStatusChange={(tid, s) => handleUpdateTask(tid, { status: s })} showFields={showFields} />
        ) : (
          <ListView tasks={filteredTasks} onTaskClick={t => setDetailTaskId(t.id)} onEditTask={t => { setEditingTask(t); setTaskModalOpen(true); }}
            onAddTask={s => { setEditingTask(null); setTaskModalStatus(s); setTaskModalOpen(true); }}
            onStatusChange={(tid, s) => handleUpdateTask(tid, { status: s })} showFields={showFields} />
        )}
      </div>

      <TaskModal open={taskModalOpen} onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        onSave={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
        task={editingTask} projectId={id} labels={labels} members={members}
        defaultStatus={taskModalStatus} onLabelCreate={handleLabelCreate} />

      <TaskDetail taskId={detailTaskId} onClose={() => setDetailTaskId(null)}
        onUpdate={t => setTasks(prev => prev.map(x => x.id === t.id ? t : x))}
        onDelete={tid => setTasks(prev => prev.filter(t => t.id !== tid))}
        labels={labels} members={members} />

      <ProjectModal open={projectModalOpen} onClose={() => setProjectModalOpen(false)}
        onSave={handleUpdateProject} project={project}
        workspaceId={project.workspaceId} members={members} />
    </div>
  );
}
