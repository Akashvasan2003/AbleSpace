'use client';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Task, STATUS_CONFIG } from '@/types/task';
import TaskCard from './TaskCard';

const COLUMNS = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ key, ...cfg }));

interface Props {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (status: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  showFields: Record<string, boolean>;
}

export default function ListView({ tasks, onTaskClick, onEditTask, onAddTask, onStatusChange, showFields }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-3 overflow-y-auto flex-1 scrollbar-thin pb-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        const isCollapsed = collapsed[col.key];
        return (
          <div key={col.key} className="rounded-2xl border overflow-hidden shadow-2xs glass-panel"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => toggle(col.key)}
              style={{ borderBottom: isCollapsed ? 'none' : `1px solid var(--border)` }}>
              <div className="flex items-center gap-2.5">
                {isCollapsed
                  ? <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50 dark:ring-black/50" style={{ background: col.color }} />
                <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold border"
                  style={{ background: 'var(--bg)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {colTasks.length}
                </span>
              </div>
              <button onClick={e => { e.stopPropagation(); onAddTask(col.key); }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }} title="Add task">
                <Plus size={14} />
              </button>
            </div>

            {!isCollapsed && (
              <>
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onEdit={() => onEditTask(task)}
                    onStatusChange={s => onStatusChange(task.id, s)}
                    showFields={showFields}
                    view="list"
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>No tasks</div>
                )}
                <button onClick={() => onAddTask(col.key)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:opacity-70 transition-opacity border-t"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <Plus size={13} /> Add task
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
