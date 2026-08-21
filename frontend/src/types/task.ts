export interface UserMin {
  id: string;
  name: string;
  avatar?: string | null;
  email?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  title?: string | null;
  username?: string | null;
  provider?: string;
  createdAt?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface TaskLabel {
  label: Label;
}

export interface TaskMember {
  user: UserMin;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  taskId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: UserMin;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  user: UserMin;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  assignee?: UserMin | null;
  members: TaskMember[];
  subtasks: Subtask[];
  labels: TaskLabel[];
  comments?: Comment[];
  activities?: ActivityLog[];
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number; subtasks: number };
  project?: { id: string; name: string; color: string; labels: Label[] };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  leadId?: string | null;
  lead?: UserMin | null;
  workspaceId: string;
  tasks: Task[];
  labels: Label[];
  workspace?: {
    members: { user: UserMin }[];
  };
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Status = 'todo' | 'doing' | 'completed' | 'on-hold';

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: '#ef4444' },
  high:   { label: 'High',   color: '#f97316' },
  medium: { label: 'Medium', color: '#eab308' },
  low:    { label: 'Low',    color: '#22c55e' },
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  todo:      { label: 'To Do',     color: '#64748b', bg: '#f1f5f9' },
  doing:     { label: 'Doing',     color: '#3b82f6', bg: '#eff6ff' },
  completed: { label: 'Completed', color: '#22c55e', bg: '#f0fdf4' },
  'on-hold': { label: 'On Hold',   color: '#f59e0b', bg: '#fffbeb' },
};

export const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',     color: '#3b82f6', bg: '#eff6ff' },
  planning:  { label: 'Planning',   color: '#8b5cf6', bg: '#f5f3ff' },
  'on-hold': { label: 'On Hold',    color: '#f59e0b', bg: '#fffbeb' },
  completed: { label: 'Completed',  color: '#22c55e', bg: '#f0fdf4' },
  cancelled: { label: 'Cancelled',  color: '#ef4444', bg: '#fef2f2' },
};
