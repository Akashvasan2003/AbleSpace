import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  CreateLabelDto,
} from './projects.dto';

const USER_SELECT = { id: true, name: true, avatar: true } as const;

const PROJECT_LIST_INCLUDE = {
  _count: { select: { tasks: true } },
  lead: { select: USER_SELECT },
  tasks: { select: { id: true, status: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProjectQueryDto, userId: string) {
    const { workspaceId, status, priority, search } = query;

    // Build workspace filter — only workspaces the user belongs to
    const workspaceWhere = workspaceId
      ? { id: workspaceId, members: { some: { userId } } }
      : { members: { some: { userId } } };

    const workspaces = await this.prisma.workspace.findMany({
      where: workspaceWhere,
      select: { id: true },
    });
    const wsIds = workspaces.map((w) => w.id);

    if (workspaceId && wsIds.length === 0) {
      return [];
    }

    const where: Record<string, unknown> = { workspaceId: { in: wsIds } };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    return this.prisma.project.findMany({
      where,
      include: PROJECT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignee: { select: USER_SELECT },
            members: { include: { user: { select: USER_SELECT } } },
            subtasks: true,
            labels: { include: { label: true } },
            _count: { select: { comments: true } },
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        },
        labels: true,
        lead: { select: USER_SELECT },
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    this.assertMember(project, userId);
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    // Verify user is a member of the target workspace
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: dto.workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    await this.assertLeadAccess(dto.workspaceId, dto.leadId);

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color ?? '#6366f1',
        status: dto.status ?? 'active',
        priority: dto.priority ?? 'medium',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        leadId: dto.leadId ?? null,
        workspaceId: dto.workspaceId,
      },
      include: PROJECT_LIST_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const project = await this.assertProjectAccess(id, userId);
    await this.assertLeadAccess(project.workspaceId, dto.leadId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        dueDate:
          dto.dueDate !== undefined
            ? dto.dueDate
              ? new Date(dto.dueDate)
              : null
            : undefined,
      },
      include: PROJECT_LIST_INCLUDE,
    });
  }

  async remove(id: string, userId: string) {
    await this.assertProjectAccess(id, userId);
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true, id };
  }

  async createLabel(projectId: string, dto: CreateLabelDto, userId: string) {
    await this.assertProjectAccess(projectId, userId);
    return this.prisma.label.create({
      data: { projectId, name: dto.name, color: dto.color },
    });
  }

  async deleteLabel(labelId: string, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      select: { projectId: true },
    });
    if (!label) throw new NotFoundException('Label not found');
    await this.assertProjectAccess(label.projectId, userId);
    await this.prisma.label.delete({ where: { id: labelId } });
    return { deleted: true, id: labelId };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private assertMember(
    project: {
      workspace: { members: { userId?: string; user?: { id: string } }[] };
    },
    userId: string,
  ) {
    const isMember = project.workspace.members.some(
      (m: { userId?: string; user?: { id: string } }) =>
        m.userId === userId || m.user?.id === userId,
    );
    if (!isMember) throw new ForbiddenException('Access denied');
  }

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        workspaceId: true,
        workspace: { select: { members: { select: { userId: true } } } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    const isMember = project.workspace.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied');
    return project;
  }

  private async assertLeadAccess(workspaceId: string, leadId?: string | null) {
    if (!leadId) return;
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: leadId } },
    });
    if (!member)
      throw new BadRequestException('Project lead must be a workspace member');
  }
}
