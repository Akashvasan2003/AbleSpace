import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../prisma/prisma.service';

const userId = 'user_cuid_001';
const workspaceId = 'ws_cuid_001';

const mockWorkspace = {
  id: workspaceId,
  name: 'Test Workspace',
  slug: 'test-workspace-123',
  ownerId: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { projects: 0, members: 1 },
  members: [
    {
      userId,
      role: 'owner',
      user: {
        id: userId,
        name: 'Test',
        email: 'test@example.com',
        avatar: null,
        title: null,
      },
    },
  ],
  projects: [],
};

const mockPrisma = {
  workspace: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  workspaceMember: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
};

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns workspaces for user', async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([mockWorkspace]);
      const result = await service.findAll(userId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns workspace for member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      const result = await service.findOne(workspaceId, userId);
      expect(result).toMatchObject({ id: workspaceId });
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      await expect(service.findOne(workspaceId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException if not a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        members: [{ userId: 'other', user: { id: 'other' } }],
      });
      await expect(service.findOne(workspaceId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates workspace and adds owner as member', async () => {
      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);
      const result = await service.create(userId, { name: 'Test Workspace' });
      expect(result).toMatchObject({ id: workspaceId });
      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: userId }) as unknown,
        }),
      );
    });
  });

  describe('update', () => {
    it('throws ForbiddenException if not owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other',
      });
      await expect(
        service.update(workspaceId, { name: 'New' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates workspace for owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspace.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated',
      });
      const result = await service.update(
        workspaceId,
        { name: 'Updated' },
        userId,
      );
      expect(result).toMatchObject({ name: 'Updated' });
    });
  });

  describe('addMember', () => {
    it('throws NotFoundException if target user not found', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.addMember(workspaceId, 'new_user', 'member', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException if already a member', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'new_user' });
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        service.addMember(workspaceId, 'new_user', 'member', userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('throws ForbiddenException when removing owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        role: 'owner',
      });
      await expect(
        service.removeMember(workspaceId, userId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
