'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Project, UserMin, PRIORITY_CONFIG, PROJECT_STATUS_CONFIG } from '@/types/task';

const PROJECT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#f97316',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  project?: Project | null;
  workspaceId: string;
  members: UserMin[];
}

export default function ProjectModal({ open, onClose, onSave, project, workspaceId, members }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [leadId, setLeadId] = useState('');
  const [saving, setSaving] = useState(false);
  const [prevProject, setPrevProject] = useState(project);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen || project !== prevProject) {
    setPrevOpen(open);
    setPrevProject(project);
    if (open) {
      if (project) {
        setName(project.name);
        setDescription(project.description || '');
        setColor(project.color);
        setStatus(project.status || 'active');
        setPriority(project.priority || 'medium');
        setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
        setLeadId(project.leadId || '');
      } else {
        setName(''); setDescription(''); setColor(PROJECT_COLORS[0]);
        setStatus('active'); setPriority('medium'); setDueDate(''); setLeadId('');
      }
    }
  }

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description, color, status, priority, dueDate: dueDate || null, leadId: leadId || null, workspaceId });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity fade-in" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden modal-animate"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base tracking-tight">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="Project name" required
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-accent/20"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />

          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)" rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none resize-none transition-all focus:ring-2 focus:ring-accent/20"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? 'var(--text)' : 'transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {Object.entries(PROJECT_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Lead</label>
              <select value={leadId} onChange={e => setLeadId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="">No lead</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
            <button type="submit" disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
              {saving ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
