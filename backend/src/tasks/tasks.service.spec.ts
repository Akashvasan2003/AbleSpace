import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user_cuid_001';
const projectId = 'proj_cuid_001';
const taskId = 'task_cuid_001';
const workspaceMembers = [{ userId }];

const mockTask = {
  id: taskId,
  title: 'Test Task',
  description: null,
  status: 'todo',
  priority: 'medium',
  projectId,
  assigneeId: null,
  dueDate: null,
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  project: { workspace: { members: workspaceMembers } },
  assignee: null,
  members: [],
  subtasks: [],
  labels: [],
  _count: { comments: 0, subtasks: 0 },
};

const mockPrisma = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  project: { findUnique: jest.fn() },
  subtask: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  comment: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  activityLog: { create: jest.fn(), findMany: jest.fn() },
  taskLabel: { createMany: jest.fn(), deleteMany: jest.fn() },
  taskMember: { createMany: jest.fn(), deleteMany: jest.fn() },
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated tasks for a project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: workspaceMembers },
      });
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await service.findAll(
        { projectId, page: 1, limit: 10 },
        userId,
      );
      expect(result).toEqual({
        data: [mockTask],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('throws ForbiddenException if user not in workspace', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: [{ userId: 'other_user' }] },
      });
      await expect(service.findAll({ projectId }, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('returns task if user is workspace member', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        comments: [],
        activities: [],
      });
      const result = await service.findOne(taskId, userId);
      expect(result).toMatchObject({ id: taskId });
    });

    it('throws NotFoundException if task missing', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);
      await expect(service.findOne(taskId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        project: { workspace: { members: [{ userId: 'other' }] } },
        comments: [],
        activities: [],
      });
      await expect(service.findOne(taskId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates task and logs activity', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: workspaceMembers },
      });
      mockPrisma.task.create.mockResolvedValue(mockTask);
      mockPrisma.activityLog.create.mockResolvedValue({});
      // findOne call after create
      mockPrisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        comments: [],
        activities: [],
      });

      const result = await service.create(
        { title: 'Test Task', projectId },
        userId,
      );
      expect(result).toMatchObject({ id: taskId });
      expect(mockPrisma.activityLog.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('deletes task if user is member', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockResolvedValue(mockTask);
      const result = await service.remove(taskId, userId);
      expect(result).toEqual({ deleted: true, id: taskId });
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...mockTask,
        project: { workspace: { members: [{ userId: 'other' }] } },
      });
      await expect(service.remove(taskId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createSubtask', () => {
    it('creates subtask after access check', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      mockPrisma.subtask.create.mockResolvedValue({
        id: 'sub_001',
        title: 'Sub',
        done: false,
        taskId,
      });
      mockPrisma.activityLog.create.mockResolvedValue({});
      const result = await service.createSubtask(
        taskId,
        { title: 'Sub' },
        userId,
      );
      expect(result).toMatchObject({ title: 'Sub' });
    });
  });

  describe('addComment', () => {
    it('adds comment and logs activity', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(mockTask);
      const comment = {
        id: 'cmt_001',
        content: 'Hello',
        taskId,
        userId,
        user: { id: userId, name: 'Test', avatar: null },
      };
      mockPrisma.comment.create.mockResolvedValue(comment);
      mockPrisma.activityLog.create.mockResolvedValue({});
      const result = await service.addComment(
        taskId,
        { content: 'Hello' },
        userId,
      );
      expect(result).toMatchObject({ content: 'Hello' });
    });
  });

  describe('deleteComment', () => {
    it('throws ForbiddenException if not comment owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'cmt_001',
        userId: 'other_user',
      });
      await expect(service.deleteComment('cmt_001', userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes comment if owner', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({
        id: 'cmt_001',
        userId,
      });
      mockPrisma.comment.delete.mockResolvedValue({});
      const result = await service.deleteComment('cmt_001', userId);
      expect(result).toEqual({ deleted: true, id: 'cmt_001' });
    });
  });
});
