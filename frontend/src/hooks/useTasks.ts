'use client';
import { useState, useCallback } from 'react';
import { tasksApi, projectsApi, getErrorMessage } from '@/lib/api';
import type { Task, Project, Label } from '@/types/task';

export function useTasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(getErrorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback((id: string) =>
    request<Project>(() => projectsApi.get(id)), [request]);

  const fetchTask = useCallback((id: string) =>
    request<Task>(() => tasksApi.get(id)), [request]);

  const createTask = useCallback((data: Parameters<typeof tasksApi.create>[0]) =>
    request<Task>(() => tasksApi.create(data)), [request]);

  const updateTask = useCallback((id: string, data: Parameters<typeof tasksApi.update>[1]) =>
    request<Task>(() => tasksApi.update(id, data)), [request]);

  const deleteTask = useCallback((id: string) =>
    request(() => tasksApi.remove(id)), [request]);

  const createSubtask = useCallback((taskId: string, title: string) =>
    request(() => tasksApi.createSubtask(taskId, title)), [request]);

  const updateSubtask = useCallback((subId: string, taskId: string, data: { title?: string; done?: boolean }) =>
    request(() => tasksApi.updateSubtask(subId, taskId, data)), [request]);

  const deleteSubtask = useCallback((subId: string, taskId: string) =>
    request(() => tasksApi.deleteSubtask(subId, taskId)), [request]);

  const addComment = useCallback((taskId: string, content: string) =>
    request(() => tasksApi.addComment(taskId, content)), [request]);

  const updateComment = useCallback((commentId: string, content: string) =>
    request(() => tasksApi.updateComment(commentId, content)), [request]);

  const deleteComment = useCallback((commentId: string) =>
    request(() => tasksApi.deleteComment(commentId)), [request]);

  const createLabel = useCallback((projectId: string, name: string, color: string) =>
    request<Label>(() => projectsApi.createLabel(projectId, { name, color })), [request]);

  return {
    loading, error,
    fetchProject, fetchTask,
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask,
    addComment, updateComment, deleteComment,
    createLabel,
  };
}
