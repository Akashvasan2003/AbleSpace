import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspaces.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { projects: true, members: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        projects: {
          select: { id: true, name: true, color: true, status: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                title: true,
              },
            },
          },
        },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember)
      throw new ForbiddenException('Not a member of this workspace');

    return workspace;
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug,
        ownerId: userId,
        members: { create: { userId, role: 'owner' } },
      },
      include: { _count: { select: { projects: true, members: true } } },
    });
  }

  async update(id: string, dto: UpdateWorkspaceDto, userId: string) {
    await this.assertOwner(id, userId);
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
      include: { _count: { select: { projects: true, members: true } } },
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.workspace.delete({ where: { id } });
    return { deleted: true, id };
  }

  async addMember(
    workspaceId: string,
    targetUserIdentifier: string,
    role: string,
    requesterId: string,
  ) {
    await this.assertOwner(workspaceId, requesterId);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: targetUserIdentifier },
          { email: targetUserIdentifier },
          { username: targetUserIdentifier },
        ],
      },
    });
    if (!user)
      throw new NotFoundException('User not found by ID, email, or username');

    const existing = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (existing) throw new ConflictException('User is already a member');

    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId: user.id, role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            title: true,
          },
        },
      },
    });
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    await this.assertOwner(workspaceId, requesterId);
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner')
      throw new ForbiddenException('Cannot remove the workspace owner');

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
    return { deleted: true };
  }

  private async assertOwner(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    if (workspace.ownerId !== userId)
      throw new ForbiddenException(
        'Only the workspace owner can perform this action',
      );
  }
}
