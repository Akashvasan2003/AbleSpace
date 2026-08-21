'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
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

export default function BoardView({ tasks, onTaskClick, onEditTask, onAddTask, onStatusChange, showFields }: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onStatusChange(taskId, status);
    setDragOver(null);
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOver(key);
  };

  const handleDragLeave = () => setDragOver(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-0 flex-1 h-full">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        const isOver = dragOver === col.key;
        return (
          <div key={col.key}
            className="flex-shrink-0 w-[18.5rem] sm:w-80 flex flex-col rounded-2xl overflow-hidden transition-all duration-200 border shadow-xs"
            style={{
              background: isOver ? 'var(--accent-light)' : 'var(--bg-card)',
              borderColor: isOver ? 'var(--accent)' : 'var(--border)',
            }}
            onDrop={e => handleDrop(e, col.key)}
            onDragOver={e => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}>

            {/* Column header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50 dark:ring-black/50" style={{ background: col.color }} />
                <span className="text-xs font-bold uppercase tracking-wider">{col.label}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold border"
                  style={{ background: 'var(--bg)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  {colTasks.length}
                </span>
              </div>
              <button onClick={() => onAddTask(col.key)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Add task">
                <Plus size={15} />
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin min-h-[140px]">
              {colTasks.map(task => (
                <div key={task.id} draggable onDragStart={e => handleDragStart(e, task.id)} className="cursor-grab active:cursor-grabbing">
                  <TaskCard
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onEdit={() => onEditTask(task)}
                    onStatusChange={s => onStatusChange(task.id, s)}
                    showFields={showFields}
                    view="board"
                  />
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed transition-all"
                  style={{ borderColor: isOver ? 'var(--accent)' : 'var(--border)', background: isOver ? 'var(--accent-glow)' : 'transparent' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {isOver ? 'Drop task here' : 'No tasks'}
                  </p>
                </div>
              )}
            </div>

            {/* Add task footer */}
            <button onClick={() => onAddTask(col.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-t hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Plus size={14} /> Add task
            </button>
          </div>
        );
      })}
    </div>
  );
}
