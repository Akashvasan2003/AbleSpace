'use client';
import { useState } from 'react';
import { X, Calendar, Flag, User, Tag, Users, Plus, Check } from 'lucide-react';
import { Task, Label, UserMin, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';
import { Avatar } from './TaskCard';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  task?: Task | null;
  projectId: string;
  labels: Label[];
  members: UserMin[];
  defaultStatus?: string;
  onLabelCreate?: (name: string, color: string) => Promise<Label | null>;
}

const LABEL_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

export default function TaskModal({ open, onClose, onSave, task, projectId, labels, members, defaultStatus = 'todo', onLabelCreate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[4]);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [prevTask, setPrevTask] = useState(task);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen || task !== prevTask) {
    setPrevOpen(open);
    setPrevTask(task);
    if (open) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setStatus(task.status);
        setPriority(task.priority);
        setAssigneeId(task.assigneeId || '');
        setMemberIds(task.members.map(m => m.user.id));
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setLabelIds(task.labels.map(l => l.label.id));
      } else {
        setTitle(''); setDescription(''); setStatus(defaultStatus);
        setPriority('medium'); setAssigneeId(''); setMemberIds([]);
        setDueDate(''); setLabelIds([]);
      }
      setShowLabelForm(false);
      setNewLabelName('');
    }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description, status, priority, assigneeId: assigneeId || null, memberIds, dueDate: dueDate || null, labelIds, projectId });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleLabel = (id: string) =>
    setLabelIds(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  const toggleMember = (id: string) =>
    setMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !onLabelCreate) return;
    setCreatingLabel(true);
    const label = await onLabelCreate(newLabelName.trim(), newLabelColor);
    if (label) {
      setLabelIds(prev => [...prev, label.id]);
      setNewLabelName('');
      setShowLabelForm(false);
    }
    setCreatingLabel(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity fade-in" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col modal-animate"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base tracking-tight">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto scrollbar-thin">
          <div className="p-5 space-y-4">
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className="w-full px-3 py-2.5 rounded-lg border text-sm font-medium outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />

            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Flag size={11} className="inline mr-1" />Priority
                </label>
                <select value={priority} onChange={e => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <User size={11} className="inline mr-1" />Assignee
                </label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={11} className="inline mr-1" />Due Date
                </label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
            </div>

            {/* Members */}
            {members.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  <Users size={11} className="inline mr-1" />Members
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {members.map(m => {
                    const active = memberIds.includes(m.id);
                    return (
                      <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                        style={active
                          ? { background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }
                          : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                        <Avatar name={m.name} size={16} />
                        {m.name}
                        {active && <Check size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Labels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Tag size={11} className="inline mr-1" />Labels
                </label>
                {onLabelCreate && (
                  <button type="button" onClick={() => setShowLabelForm(p => !p)}
                    className="text-xs flex items-center gap-1 hover:opacity-70"
                    style={{ color: 'var(--accent)' }}>
                    <Plus size={11} /> New label
                  </button>
                )}
              </div>

              {showLabelForm && (
                <div className="flex gap-2 mb-2 p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <input value={newLabelName} onChange={e => setNewLabelName(e.target.value)}
                    placeholder="Label name" className="flex-1 text-xs bg-transparent outline-none"
                    style={{ color: 'var(--text)' }} />
                  <div className="flex gap-1">
                    {LABEL_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setNewLabelColor(c)}
                        className="w-4 h-4 rounded-full border-2 transition-all"
                        style={{ background: c, borderColor: newLabelColor === c ? 'var(--text)' : 'transparent' }} />
                    ))}
                  </div>
                  <button type="button" onClick={handleCreateLabel} disabled={!newLabelName.trim() || creatingLabel}
                    className="text-xs px-2 py-1 rounded font-medium disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                    Add
                  </button>
                </div>
              )}

              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(l => (
                    <button key={l.id} type="button" onClick={() => toggleLabel(l.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                      style={labelIds.includes(l.id)
                        ? { background: l.color, color: '#fff', borderColor: l.color }
                        : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
              {labels.length === 0 && !showLabelForm && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No labels yet. Create one above.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
