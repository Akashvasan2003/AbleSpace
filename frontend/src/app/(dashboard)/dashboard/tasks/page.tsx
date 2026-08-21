'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, LayoutGrid, List, Search, Filter, SlidersHorizontal, X, RefreshCw } from 'lucide-react';
import { Task, Project, Label, UserMin, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import BoardView from '@/components/tasks/BoardView';
import ListView from '@/components/tasks/ListView';
import TaskModal from '@/components/tasks/TaskModal';
import TaskDetail from '@/components/tasks/TaskDetail';
import api from '@/lib/api';

const DEFAULT_FIELDS = { priority: true, dueDate: true, assignee: true, labels: true, comments: true, subtasks: true };

export default function TasksPage() {
  const { createTask, updateTask, fetchProject, createLabel } = useTasks();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFields, setShowFields] = useState(DEFAULT_FIELDS);
  const [showFieldsMenu, setShowFieldsMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStatus, setModalDefaultStatus] = useState('todo');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Bootstrap workspace + project
  useEffect(() => {
    api.get('/workspaces').then(async res => {
      const workspaces = res.data;
      let ws = workspaces[0];
      if (!ws) {
        ws = await api.post('/workspaces', { name: 'My Workspace' }).then(r => r.data);
      }
      const projs = await api.get(`/projects?workspaceId=${ws.id}`).then(r => r.data);
      if (!projs.length) {
        const proj = await api.post('/projects', { workspaceId: ws.id, name: 'My Project', color: '#3b82f6' }).then(r => r.data);
        setProjects([proj]);
        setProjectId(proj.id);
      } else {
        setProjects(projs);
        setProjectId(projs[0].id);
      }
    }).catch(() => setError('Failed to load workspace'));
  }, []);

  const loadProject = useCallback(async (id: string) => {
    if (!id) return;
    setError('');
    const p = await fetchProject(id);
    if (p) { setProject(p); setTasks(p.tasks); }
    else setError('Failed to load project');
    setLoading(false);
  }, [fetchProject]);

  useEffect(() => {
    if (projectId) {
      queueMicrotask(() => {
        void loadProject(projectId);
      });
    }
  }, [projectId, loadProject]);

  // Close dropdowns on outside click
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
    const task = await createTask({ ...(data as Parameters<typeof createTask>[0]), projectId });
    if (task) setTasks(prev => [...prev, task]);
  };

  const handleUpdateTask = async (id: string, data: Record<string, unknown>) => {
    const task = await updateTask(id, data);
    if (task) setTasks(prev => prev.map(t => t.id === id ? task : t));
  };

  const handleStatusChange = (taskId: string, status: string) => handleUpdateTask(taskId, { status });

  const handleTaskDetailUpdate = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleTaskDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const openCreate = (status = 'todo') => {
    setEditingTask(null);
    setModalDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleTaskClick = (task: Task) => setDetailTaskId(task.id);

  const handleLabelCreate = async (name: string, color: string): Promise<Label | null> => {
    const label = await createLabel(projectId, name, color);
    if (label) {
      setProject(prev => prev ? { ...prev, labels: [...prev.labels, label] } : prev);
    }
    return label;
  };

  const activeFilters = [filterPriority, filterStatus].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full min-h-0 w-full max-w-[1600px] mx-auto gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4 flex-shrink-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-xl font-semibold flex-shrink-0">Tasks</h2>
          {projects.length > 1 && (
            <select value={projectId} onChange={e => setProjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          </div>

          <div className="flex items-center gap-2 flex-wrap xl:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              className="pl-8 pr-8 py-1.5 rounded-lg border text-sm outline-none w-full sm:w-48"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text)' }} />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilterMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{
                borderColor: activeFilters ? 'var(--accent)' : 'var(--border)',
                background: activeFilters ? 'var(--accent-light)' : 'var(--bg-card)',
                color: activeFilters ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              <Filter size={13} />
              Filter{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-9 z-20 w-52 rounded-xl shadow-lg border p-3 space-y-3"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <button key={k} onClick={() => setFilterPriority(p => p === k ? '' : k)}
                        className="px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={filterPriority === k
                          ? { background: v.color, color: '#fff', borderColor: v.color }
                          : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
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
                        style={filterStatus === k
                          ? { background: v.color, color: '#fff', borderColor: v.color }
                          : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button onClick={() => { setFilterPriority(''); setFilterStatus(''); }}
                    className="text-xs w-full text-center" style={{ color: 'var(--accent)' }}>
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Fields show/hide */}
          <div className="relative" ref={fieldsRef}>
            <button onClick={() => setShowFieldsMenu(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
              <SlidersHorizontal size={13} />
              Fields
            </button>
            {showFieldsMenu && (
              <div className="absolute right-0 top-9 z-20 w-44 rounded-xl shadow-lg border p-2"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                {Object.entries(showFields).map(([field, visible]) => (
                  <button key={field}
                    onClick={() => setShowFields(p => ({ ...p, [field]: !p[field as keyof typeof p] }))}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:opacity-80 capitalize">
                    <span style={{ color: 'var(--text)' }}>{field}</span>
                    <div className="w-8 h-4 rounded-full transition-colors relative flex-shrink-0"
                      style={{ background: visible ? 'var(--accent)' : 'var(--border)' }}>
                      <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                        style={{ left: visible ? '17px' : '2px' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setView('board')} className="p-1.5 transition-colors"
              style={{
                background: view === 'board' ? 'var(--accent)' : 'var(--bg-card)',
                color: view === 'board' ? 'var(--accent-fg)' : 'var(--text-muted)',
              }}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('list')} className="p-1.5 transition-colors"
              style={{
                background: view === 'list' ? 'var(--accent)' : 'var(--bg-card)',
                color: view === 'list' ? 'var(--accent-fg)' : 'var(--text-muted)',
              }}>
              <List size={15} />
            </button>
          </div>

          {/* New task */}
          <button onClick={() => openCreate()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <Plus size={15} />
            <span className="hidden sm:inline">New Task</span>
          </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs flex-shrink-0 px-1" style={{ color: 'var(--text-muted)' }}>
        <span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        {(search || activeFilters > 0) && <span style={{ color: 'var(--accent)' }}>Filtered</span>}
        <button onClick={() => loadProject(projectId)} className="flex items-center gap-1 hover:opacity-70 ml-auto">
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 rounded-lg text-sm text-red-500 border border-red-200 flex-shrink-0"
          style={{ background: '#fef2f2' }}>
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className={`flex-1 min-h-0 overflow-hidden ${view === 'board' ? 'flex' : 'flex flex-col'}`}>
          {view === 'board' ? (
            <BoardView
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onEditTask={openEdit}
              onAddTask={openCreate}
              onStatusChange={handleStatusChange}
              showFields={showFields}
            />
          ) : (
            <ListView
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onEditTask={openEdit}
              onAddTask={openCreate}
              onStatusChange={handleStatusChange}
              showFields={showFields}
            />
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
        task={editingTask}
        projectId={projectId}
        labels={labels}
        members={members}
        defaultStatus={modalDefaultStatus}
        onLabelCreate={handleLabelCreate}
      />

      {/* Task Detail */}
      <TaskDetail
        taskId={detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onUpdate={handleTaskDetailUpdate}
        onDelete={handleTaskDelete}
        labels={labels}
        members={members}
      />
    </div>
  );
}
