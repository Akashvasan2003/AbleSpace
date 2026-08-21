'use client';
import { useEffect, useState } from 'react';
import { Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { EmptyState, ErrorState, PageSpinner } from '@/components/ui';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { workspacesApi, Workspace, WorkspaceMember, getErrorMessage } from '@/lib/api';

const roleColors: Record<string, string> = {
  owner: '#3b82f6',
  admin: '#8b5cf6',
  member: '#10b981',
  viewer: '#94a3b8',
};

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'U';
}

export default function TeamPage() {
  const toast = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const workspaces = await workspacesApi.list();
      let current = workspaces[0];
      if (!current) current = await workspacesApi.create('My Workspace');
      const detail = await workspacesApi.get(current.id);
      setWorkspace(detail);
      setMembers(detail.members || []);
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

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace || !newUserId.trim()) return;
    setSaving(true);
    try {
      const member = await workspacesApi.addMember(workspace.id, newUserId.trim(), newRole);
      setMembers((prev) => [...prev, member]);
      setNewUserId('');
      toast.success('Member added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!workspace || !removeTarget) return;
    setSaving(true);
    try {
      await workspacesApi.removeMember(workspace.id, removeTarget.user.id);
      setMembers((prev) => prev.filter((member) => member.user.id !== removeTarget.user.id));
      toast.success('Member removed');
      setRemoveTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Team</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{members.length} member{members.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <form
        onSubmit={handleAddMember}
        className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-end"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>User ID, Email, or Username</label>
          <input
            value={newUserId}
            onChange={(event) => setNewUserId(event.target.value)}
            placeholder="e.g. demo@ablespace.local, @username, or User ID"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
        <div className="md:w-40">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Role</label>
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving || !newUserId.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          <UserPlus size={16} />
          Add Member
        </button>
      </form>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Add a member by user id to collaborate in this workspace." />
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="hidden md:grid px-5 py-3 border-b grid-cols-[1.4fr_1.5fr_.7fr_48px] text-xs font-medium" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <span>Member</span>
            <span>Email</span>
            <span>Role</span>
            <span />
          </div>
          {members.map((member, index) => {
            const role = member.role || 'member';
            const color = roleColors[role] || roleColors.member;
            return (
              <div
                key={member.user.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1.5fr_.7fr_48px] md:items-center"
                style={{ borderBottom: index < members.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                    {member.user.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={member.user.avatar} alt={member.user.name} className="w-full h-full rounded-full object-cover" />
                    ) : initials(member.user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.user.name}</p>
                    {member.user.title && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{member.user.title}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm min-w-0" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={12} className="flex-shrink-0" />
                  <span className="truncate">{member.user.email}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium w-fit capitalize" style={{ background: color + '20', color }}>
                  {role}
                </span>
                <button
                  type="button"
                  disabled={role === 'owner'}
                  onClick={() => setRemoveTarget(member)}
                  className="p-2 rounded-lg text-red-500 disabled:opacity-30 disabled:cursor-not-allowed w-fit md:ml-auto"
                  aria-label={`Remove ${member.user.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove Member"
        message={`Remove ${removeTarget?.user.name || 'this member'} from the workspace?`}
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
