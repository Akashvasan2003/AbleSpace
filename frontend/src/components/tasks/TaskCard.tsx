'use client';
import { Calendar, MessageSquare, CheckSquare, Flag, Edit2 } from 'lucide-react';
import { Task, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';

interface Props {
  task: Task;
  onClick: () => void;
  onEdit?: () => void;
  onStatusChange: (status: string) => void;
  showFields: Record<string, boolean>;
  view: 'board' | 'list';
}

export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: color }}>
      {name[0].toUpperCase()}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-2xs"
      style={{ background: cfg.color + '15', color: cfg.color, borderColor: cfg.color + '30' }}>
      <Flag size={10} />
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border shadow-2xs"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + '30' }}>
      {cfg.label}
    </span>
  );
}

export default function TaskCard({ task, onClick, onEdit, onStatusChange, showFields, view }: Props) {
  const doneSubtasks = task.subtasks.filter(s => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const allMembers = [
    ...(task.assignee ? [task.assignee] : []),
    ...task.members.map(m => m.user).filter(u => u.id !== task.assigneeId),
  ];

  if (view === 'list') {
    return (
      <div onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 border-b group"
        style={{ borderColor: 'var(--border)' }}>
        {/* Status circle */}
        <button
          onClick={e => {
            e.stopPropagation();
            const statuses = Object.keys(STATUS_CONFIG);
            const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
            onStatusChange(next);
          }}
          title="Cycle status"
          className="flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110"
          style={{
            borderColor: STATUS_CONFIG[task.status]?.color || '#94a3b8',
            background: task.status === 'completed' ? STATUS_CONFIG[task.status]?.color : 'transparent',
          }}
        />

        <p className="flex-1 text-xs font-semibold truncate min-w-0"
          style={{
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
          }}>
          {task.title}
        </p>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {showFields.labels && task.labels.length > 0 && (
            <div className="hidden md:flex gap-1">
              {task.labels.slice(0, 2).map(({ label }) => (
                <span key={label.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ background: label.color + '20', color: label.color, borderColor: label.color + '30' }}>{label.name}</span>
              ))}
            </div>
          )}
          {showFields.priority && <PriorityBadge priority={task.priority} />}
          {showFields.dueDate && task.dueDate && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium"
              style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {showFields.subtasks && totalSubtasks > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <CheckSquare size={12} />{doneSubtasks}/{totalSubtasks}
            </span>
          )}
          {showFields.comments && (task._count?.comments ?? 0) > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={12} />{task._count?.comments}
            </span>
          )}
          {showFields.assignee && allMembers.length > 0 && (
            <div className="flex -space-x-1.5">
              {allMembers.slice(0, 3).map(u => <Avatar key={u.id} name={u.name} size={22} />)}
            </div>
          )}
          {onEdit && (
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
              style={{ color: 'var(--text-muted)' }}>
              <Edit2 size={13} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Board card
  return (
    <div onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border group glass-panel"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      {/* Top row: labels + edit */}
      <div className="flex items-start justify-between gap-1 mb-2">
        {showFields.labels && task.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.labels.map(({ label }) => (
              <span key={label.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{ background: label.color + '20', color: label.color, borderColor: label.color + '30' }}>{label.name}</span>
            ))}
          </div>
        ) : <div />}
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}>
            <Edit2 size={13} />
          </button>
        )}
      </div>

      <p className="text-xs font-bold leading-snug mb-2.5"
        style={{
          textDecoration: task.status === 'completed' ? 'line-through' : 'none',
          color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text)',
        }}>
        {task.title}
      </p>

      {showFields.priority && (
        <div className="mb-3"><PriorityBadge priority={task.priority} /></div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          {showFields.dueDate && task.dueDate && (
            <span className="flex items-center gap-1 text-[11px] font-medium"
              style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {showFields.subtasks && totalSubtasks > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <CheckSquare size={12} />{doneSubtasks}/{totalSubtasks}
            </span>
          )}
          {showFields.comments && (task._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <MessageSquare size={12} />{task._count?.comments}
            </span>
          )}
        </div>
        {showFields.assignee && allMembers.length > 0 && (
          <div className="flex -space-x-1.5 flex-shrink-0">
            {allMembers.slice(0, 3).map(u => <Avatar key={u.id} name={u.name} size={22} />)}
          </div>
        )}
      </div>
    </div>
  );
}
