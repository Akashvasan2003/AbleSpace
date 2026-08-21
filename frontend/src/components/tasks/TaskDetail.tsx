'use client';
import { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Check, Users } from 'lucide-react';
import { Task, Subtask, Label, UserMin, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Avatar, StatusBadge } from './TaskCard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/index';

interface Props {
  taskId: string | null;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  labels: Label[];
  members: UserMin[];
}

type Tab = 'subtasks' | 'comments' | 'activity';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function activityText(a: { action: string; field?: string | null; oldValue?: string | null; newValue?: string | null }) {
  if (a.action === 'created') return 'created this task';
  if (a.action === 'commented') return `commented: "${a.newValue}"`;
  if (a.action === 'added_subtask') return `added subtask "${a.newValue}"`;
  if (a.action === 'updated' && a.field) {
    return `changed ${a.field}: ${a.oldValue || 'none'} → ${a.newValue || 'none'}`;
  }
  return a.action;
}

export default function TaskDetail({ taskId, onClose, onUpdate, onDelete, labels, members }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const { fetchTask, updateTask, deleteTask, createSubtask, updateSubtask, deleteSubtask, addComment, updateComment, deleteComment } = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>('subtasks');
  const [newSubtask, setNewSubtask] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [prevTaskId, setPrevTaskId] = useState(taskId);

  if (taskId !== prevTaskId) {
    setPrevTaskId(taskId);
    if (!taskId) setTask(null);
    setTab('subtasks');
  }

  useEffect(() => {
    if (!taskId) return;
    let isMounted = true;
    fetchTask(taskId).then(t => { if (isMounted && t) setTask(t); });
    return () => { isMounted = false; };
  }, [taskId, fetchTask]);

  if (!taskId) return null;

  const refresh = async () => {
    const t = await fetchTask(taskId);
    if (t) { setTask(t); onUpdate(t); }
  };

  const handleFieldUpdate = async (field: string, value: unknown) => {
    if (!task) return;
    setSaving(true);
    const updated = await updateTask(task.id, { [field]: value } as Record<string, unknown>);
    if (updated) { setTask(updated); onUpdate(updated); }
    setSaving(false);
    setEditingField(null);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtask.trim()) return;
    const sub = await createSubtask(task.id, newSubtask.trim());
    if (sub) { setNewSubtask(''); refresh(); }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    if (!task) return;
    await updateSubtask(sub.id, task.id, { done: !sub.done });
    refresh();
  };

  const handleDeleteSubtask = async (subId: string) => {
    if (!task) return;
    await deleteSubtask(subId, task.id);
    refresh();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    const c = await addComment(task.id, commentText.trim());
    if (c) { setCommentText(''); refresh(); }
  };

  const handleUpdateComment = async (id: string) => {
    if (!editCommentText.trim()) return;
    await updateComment(id, editCommentText.trim());
    setEditingComment(null);
    refresh();
  };

  const handleDeleteComment = async (id: string) => {
    await deleteComment(id);
    refresh();
  };

  const handleDelete = async () => {
    if (!task) return;
    const result = await deleteTask(task.id);
    if (result !== null) {
      toast.success('Task deleted');
      onDelete(task.id);
      onClose();
    }
    setConfirmDelete(false);
  };

  const handleMemberToggle = (userId: string) => {
    if (!task) return;
    const current = task.members.map(m => m.user.id);
    const next = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
    handleFieldUpdate('memberIds', next);
  };

  if (!task) {
    return (
      <>
        <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={onClose} />
        <div
          className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] flex items-center justify-center border-l"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <Spinner />
        </div>
      </>
    );
  }

  const doneCount = task.subtasks.filter(s => s.done).length;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs transition-opacity fade-in" onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-40 w-full sm:w-[500px] flex flex-col border-l shadow-2xl overflow-hidden transition-transform duration-300"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            {saving && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Saving...</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg hover:opacity-70 text-red-400"
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-5 space-y-4">
            {/* Title */}
            {editingField === 'title' ? (
              <input
                autoFocus
                defaultValue={task.title}
                className="w-full text-lg font-semibold bg-transparent border-b-2 outline-none pb-1"
                style={{ borderColor: 'var(--accent)', color: 'var(--text)' }}
                onBlur={e => handleFieldUpdate('title', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleFieldUpdate('title', (e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
            ) : (
              <h2
                className="text-lg font-semibold cursor-pointer hover:opacity-70 leading-snug"
                onClick={() => setEditingField('title')}
                title="Click to edit"
              >
                {task.title}
              </h2>
            )}

            {/* Description */}
            {editingField === 'description' ? (
              <textarea
                autoFocus
                defaultValue={task.description || ''}
                rows={4}
                className="w-full text-sm bg-transparent border rounded-lg p-2 outline-none resize-none"
                style={{ borderColor: 'var(--accent)', color: 'var(--text)' }}
                onBlur={e => handleFieldUpdate('description', e.target.value)}
              />
            ) : (
              <p
                className="text-sm cursor-pointer hover:opacity-70 leading-relaxed"
                style={{ color: task.description ? 'var(--text)' : 'var(--text-muted)' }}
                onClick={() => setEditingField('description')}
                title="Click to edit"
              >
                {task.description || 'Add a description...'}
              </p>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</p>
                <select
                  value={task.status}
                  onChange={e => handleFieldUpdate('status', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  aria-label="Status"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Priority</p>
                <select
                  value={task.priority}
                  onChange={e => handleFieldUpdate('priority', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  aria-label="Priority"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Assignee</p>
                <select
                  value={task.assigneeId || ''}
                  onChange={e => handleFieldUpdate('assigneeId', e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  aria-label="Assignee"
                >
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Due Date</p>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={e => handleFieldUpdate('dueDate', e.target.value || null)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  aria-label="Due date"
                />
              </div>
            </div>

            {/* Members */}
            {members.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Users size={11} className="inline mr-1" />Members
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {members.map(m => {
                    const active = task.members.some(tm => tm.user.id === m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleMemberToggle(m.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all"
                        style={active
                          ? { background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }
                          : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                        aria-pressed={active}
                      >
                        <Avatar name={m.name} size={16} />
                        {m.name}
                        {active && <Check size={9} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(l => {
                    const active = task.labels.some(tl => tl.label.id === l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          const current = task.labels.map(tl => tl.label.id);
                          const next = active ? current.filter(id => id !== l.id) : [...current, l.id];
                          handleFieldUpdate('labelIds', next);
                        }}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all"
                        style={active
                          ? { background: l.color, color: '#fff', borderColor: l.color }
                          : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
                        aria-pressed={active}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-t px-5" style={{ borderColor: 'var(--border)' }}>
            <div className="flex -mb-px" role="tablist">
              {(['subtasks', 'comments', 'activity'] as Tab[]).map(t => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className="px-4 py-3 text-sm font-medium border-b-2 capitalize transition-colors"
                  style={tab === t
                    ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { borderColor: 'transparent', color: 'var(--text-muted)' }}
                >
                  {t === 'subtasks'
                    ? `Subtasks${task.subtasks.length ? ` (${doneCount}/${task.subtasks.length})` : ''}`
                    : t === 'comments'
                    ? `Comments${task.comments?.length ? ` (${task.comments.length})` : ''}`
                    : 'Activity'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {/* Subtasks */}
            {tab === 'subtasks' && (
              <div className="space-y-2">
                {task.subtasks.length > 0 && (
                  <div className="w-full h-1.5 rounded-full mb-3" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(doneCount / task.subtasks.length) * 100}%`, background: 'var(--accent)' }}
                    />
                  </div>
                )}
                {task.subtasks.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No subtasks yet
                  </p>
                )}
                {task.subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => handleToggleSubtask(sub)}
                      className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={sub.done
                        ? { background: 'var(--accent)', borderColor: 'var(--accent)' }
                        : { borderColor: 'var(--border)' }}
                      aria-label={sub.done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {sub.done && <Check size={10} color="white" />}
                    </button>
                    <span
                      className="flex-1 text-sm"
                      style={{
                        textDecoration: sub.done ? 'line-through' : 'none',
                        color: sub.done ? 'var(--text-muted)' : 'var(--text)',
                      }}
                    >
                      {sub.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 transition-opacity"
                      aria-label="Delete subtask"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-3">
                  <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                    aria-label="New subtask title"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtask.trim()}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* Comments */}
            {tab === 'comments' && (
              <div className="space-y-4">
                {(task.comments || []).length === 0 && (
                  <p className="text-sm text-center py-2" style={{ color: 'var(--text-muted)' }}>
                    No comments yet
                  </p>
                )}
                {(task.comments || []).map(c => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={c.user.name} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{c.user.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</span>
                        {c.userId === user?.id && (
                          <div className="ml-auto flex gap-1">
                            <button
                              onClick={() => { setEditingComment(c.id); setEditCommentText(c.content); }}
                              className="p-1 rounded hover:opacity-70"
                              style={{ color: 'var(--text-muted)' }}
                              aria-label="Edit comment"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="p-1 rounded hover:opacity-70 text-red-400"
                              aria-label="Delete comment"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingComment === c.id ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={editCommentText}
                            onChange={e => setEditCommentText(e.target.value)}
                            rows={2}
                            className="w-full px-2.5 py-1.5 rounded-lg border text-sm outline-none resize-none"
                            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleUpdateComment(c.id)}
                              className="px-2.5 py-1 rounded text-xs font-medium"
                              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-2.5 py-1 rounded text-xs border"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{c.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
                  <Avatar name={user?.name || 'U'} size={28} />
                  <div className="flex-1 space-y-1.5">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      aria-label="Comment text"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                    >
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activity */}
            {tab === 'activity' && (
              <div className="space-y-3">
                {(task.activities || []).length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No activity yet
                  </p>
                )}
                {(task.activities || []).map(a => (
                  <div key={a.id} className="flex gap-2.5 items-start">
                    <Avatar name={a.user.name} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="font-medium">{a.user.name}</span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>{activityText(a)}</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Task"
        message="This will permanently delete the task and all its subtasks, comments, and activity. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
