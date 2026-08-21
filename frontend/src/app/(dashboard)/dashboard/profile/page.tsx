'use client';
import { useState } from 'react';
import { Camera, Save, User, Mail, AtSign, Briefcase, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setName(user.name || '');
      setTitle(user.title || '');
      setUsername(user.username || '');
      setAvatar(user.avatar || '');
      setAvatarPreview(user.avatar || '');
    }
  }

  const handleAvatarUrl = (url: string) => {
    setAvatar(url);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await updateProfile({
        name: name.trim(),
        title: title.trim() || undefined,
        username: username.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar section */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4 text-sm">Profile Picture</h3>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarPreview} alt={user?.name} onError={() => setAvatarPreview('')}
                  className="w-20 h-20 rounded-full object-cover border-2"
                  style={{ borderColor: 'var(--accent)' }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)', borderColor: 'var(--accent)' }}>
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <Camera size={13} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium mb-1">{user?.name}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                {user?.provider === 'guest' ? 'Guest account' : user?.email}
              </p>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Avatar URL</label>
                <input value={avatar} onChange={e => handleAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Personal info */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-4 text-sm">Personal Information</h3>
          <div className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <User size={11} className="inline mr-1" />Full Name
              </label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Your full name"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <Mail size={11} className="inline mr-1" />Email
              </label>
              <input value={user?.email || ''} readOnly
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none cursor-not-allowed"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', opacity: 0.7 }} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Email cannot be changed</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <AtSign size={11} className="inline mr-1" />Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>@</span>
                <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="your_username"
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Letters, numbers and underscores only</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <Briefcase size={11} className="inline mr-1" />Job Title
              </label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-lg border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <h3 className="font-semibold mb-3 text-sm">Account</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Account Type</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {user?.provider === 'guest' ? 'Guest - limited features' : user?.provider === 'google' ? 'Google OAuth' : 'Email & Password'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              {user?.provider || 'local'}
            </span>
          </div>
          {user?.createdAt && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-red-600 border border-red-200" style={{ background: '#fef2f2' }}>
            <AlertCircle size={15} />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-green-600 border border-green-200" style={{ background: '#f0fdf4' }}>
            <Check size={15} />Profile updated successfully
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
