import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user_cuid_001';
const workspaceId = 'ws_cuid_001';
const projectId = 'proj_cuid_001';

const mockProject = {
  id: projectId,
  name: 'Test Project',
  description: null,
  color: '#6366f1',
  status: 'active',
  priority: 'medium',
  dueDate: null,
  leadId: null,
  workspaceId,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { tasks: 0 },
  lead: null,
  tasks: [],
  workspace: {
    members: [
      {
        userId,
        user: {
          id: userId,
          name: 'Test',
          avatar: null,
          email: 'test@example.com',
        },
      },
    ],
  },
};

const mockPrisma = {
  workspace: { findMany: jest.fn() },
  workspaceMember: { findUnique: jest.fn() },
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  label: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns projects for user workspaces', async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([{ id: workspaceId }]);
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);
      const result = await service.findAll({}, userId);
      expect(result).toHaveLength(1);
    });

    it('filters by workspaceId', async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([{ id: workspaceId }]);
      mockPrisma.project.findMany.mockResolvedValue([mockProject]);
      await service.findAll({ workspaceId }, userId);
      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: workspaceId }) as unknown,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns project if user is member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      const result = await service.findOne(projectId, userId);
      expect(result).toMatchObject({ id: projectId });
    });

    it('throws NotFoundException if project missing', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne(projectId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        workspace: { members: [{ userId: 'other', user: { id: 'other' } }] },
      });
      await expect(service.findOne(projectId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('throws ForbiddenException if not workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ name: 'New', workspaceId }, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates project for workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: 'member',
      });
      mockPrisma.project.create.mockResolvedValue(mockProject);
      const result = await service.create({ name: 'New', workspaceId }, userId);
      expect(result).toMatchObject({ id: projectId });
    });
  });

  describe('remove', () => {
    it('deletes project if user is member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: [{ userId }] },
      });
      mockPrisma.project.delete.mockResolvedValue({});
      const result = await service.remove(projectId, userId);
      expect(result).toEqual({ deleted: true, id: projectId });
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: [{ userId: 'other' }] },
      });
      await expect(service.remove(projectId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('createLabel', () => {
    it('creates label for project member', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        workspace: { members: [{ userId }] },
      });
      mockPrisma.label.create.mockResolvedValue({
        id: 'lbl_001',
        name: 'Bug',
        color: '#ff0000',
        projectId,
      });
      const result = await service.createLabel(
        projectId,
        { name: 'Bug', color: '#ff0000' },
        userId,
      );
      expect(result).toMatchObject({ name: 'Bug' });
    });
  });
});
