import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  Task, Project, Subtask, Comment, ActivityLog, Label, UserProfile,
} from '@/types/task';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      Cookies.remove('token');
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

function data<T>(promise: Promise<{ data: T }>): Promise<T> {
  return promise.then((r) => r.data);
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string | string[]; errors?: string[] } | undefined;
    if (Array.isArray(body?.errors)) return body.errors.join(', ');
    if (Array.isArray(body?.message)) return body.message.join(', ');
    return body?.message || err.message;
  }
  return err instanceof Error ? err.message : 'Unknown error';
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; avatar: string | null };
}

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    data<AuthResponse>(api.post('/auth/register', body)),
  login: (body: { email: string; password: string }) =>
    data<AuthResponse>(api.post('/auth/login', body)),
  guest: () =>
    data<AuthResponse>(api.post('/auth/guest')),
  me: () =>
    data<UserProfile>(api.get('/auth/me')),
  updateProfile: (body: Partial<Pick<UserProfile, 'name' | 'title' | 'username' | 'avatar'>>) =>
    data<UserProfile>(api.patch('/auth/profile', body)),
};

export interface WorkspaceMember {
  id: string;
  role: string;
  user: UserProfile;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members?: WorkspaceMember[];
  projects?: Pick<Project, 'id' | 'name' | 'color' | 'status'>[];
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number; members: number };
}

export const workspacesApi = {
  list: () =>
    data<Workspace[]>(api.get('/workspaces')),
  get: (id: string) =>
    data<Workspace>(api.get(`/workspaces/${id}`)),
  create: (name: string) =>
    data<Workspace>(api.post('/workspaces', { name })),
  update: (id: string, name: string) =>
    data<Workspace>(api.put(`/workspaces/${id}`, { name })),
  remove: (id: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/workspaces/${id}`)),
  addMember: (id: string, userId: string, role?: string) =>
    data<WorkspaceMember>(api.post(`/workspaces/${id}/members`, { userId, role })),
  removeMember: (id: string, userId: string) =>
    data<{ deleted: boolean }>(api.delete(`/workspaces/${id}/members/${userId}`)),
};

export interface ProjectQuery {
  workspaceId?: string;
  status?: string;
  priority?: string;
  search?: string;
}

export const projectsApi = {
  list: (query?: ProjectQuery) =>
    data<Project[]>(api.get('/projects', { params: query })),
  get: (id: string) =>
    data<Project>(api.get(`/projects/${id}`)),
  create: (body: {
    name: string;
    workspaceId: string;
    description?: string;
    color?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    leadId?: string | null;
  }) => data<Project>(api.post('/projects', body)),
  update: (id: string, body: Partial<{
    name: string;
    description: string;
    color: string;
    status: string;
    priority: string;
    dueDate: string | null;
    leadId: string | null;
  }>) => data<Project>(api.put(`/projects/${id}`, body)),
  remove: (id: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/projects/${id}`)),
  createLabel: (projectId: string, body: { name: string; color: string }) =>
    data<Label>(api.post(`/projects/${projectId}/labels`, body)),
  deleteLabel: (labelId: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/projects/labels/${labelId}`)),
};

export interface TaskQuery {
  projectId?: string;
  status?: string;
  priority?: string;
  search?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export const tasksApi = {
  list: (query?: TaskQuery) =>
    data<PaginatedTasks>(api.get('/tasks', { params: query })),
  get: (id: string) =>
    data<Task>(api.get(`/tasks/${id}`)),
  create: (body: {
    title: string;
    projectId: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    labelIds?: string[];
    memberIds?: string[];
    order?: number;
  }) => data<Task>(api.post('/tasks', body)),
  update: (id: string, body: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
    labelIds: string[];
    memberIds: string[];
    order: number;
  }>) => data<Task>(api.put(`/tasks/${id}`, body)),
  remove: (id: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/tasks/${id}`)),
  createSubtask: (taskId: string, title: string) =>
    data<Subtask>(api.post(`/tasks/${taskId}/subtasks`, { title })),
  updateSubtask: (subId: string, taskId: string, body: { title?: string; done?: boolean }) =>
    data<Subtask>(api.patch(`/tasks/subtasks/${subId}?taskId=${taskId}`, body)),
  deleteSubtask: (subId: string, taskId: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/tasks/subtasks/${subId}?taskId=${taskId}`)),
  getComments: (taskId: string) =>
    data<Comment[]>(api.get(`/tasks/${taskId}/comments`)),
  addComment: (taskId: string, content: string) =>
    data<Comment>(api.post(`/tasks/${taskId}/comments`, { content })),
  updateComment: (commentId: string, content: string) =>
    data<Comment>(api.put(`/tasks/comments/${commentId}`, { content })),
  deleteComment: (commentId: string) =>
    data<{ deleted: boolean; id: string }>(api.delete(`/tasks/comments/${commentId}`)),
  getActivity: (taskId: string) =>
    data<ActivityLog[]>(api.get(`/tasks/${taskId}/activity`)),
};
