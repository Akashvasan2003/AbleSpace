import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './tasks.dto';

const USER_SELECT = { id: true, name: true, avatar: true } as const;

const TASK_INCLUDE = {
  assignee: { select: USER_SELECT },
  members: { include: { user: { select: USER_SELECT } } },
  subtasks: { orderBy: { createdAt: 'asc' as const } },
  labels: { include: { label: true } },
  _count: { select: { comments: true, subtasks: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Queries ────────────────────────────────────────────────────────────────

  async findAll(query: TaskQueryDto, userId: string) {
    const {
      projectId,
      status,
      priority,
      search,
      assigneeId,
      page = 1,
      limit = 100,
    } = query;
    const skip = (page - 1) * Math.min(limit, 200);
    const take = Math.min(limit, 200);

    const where: Record<string, unknown> = {};

    if (projectId) {
      // Verify user has access to this project's workspace
      await this.assertProjectAccess(projectId, userId);
      where.projectId = projectId;
    } else {
      // Return tasks assigned to or involving the user across all their workspaces
      where.OR = [{ assigneeId: userId }, { members: { some: { userId } } }];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data: tasks, total, page, limit: take };
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        ...TASK_INCLUDE,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            labels: true,
            workspace: {
              select: { members: { select: { userId: true } } },
            },
          },
        },
        comments: {
          include: { user: { select: USER_SELECT } },
          orderBy: { createdAt: 'asc' },
        },
        activities: {
          include: { user: { select: USER_SELECT } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Verify workspace membership
    const memberIds =
      task.project?.workspace?.members.map((m) => m.userId) ?? [];
    if (!memberIds.includes(userId)) {
      throw new ForbiddenException('Access denied');
    }

    return task;
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  async create(dto: CreateTaskDto, userId: string) {
    await this.assertProjectAccess(dto.projectId, userId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        status: dto.status ?? 'todo',
        priority: dto.priority ?? 'medium',
        assigneeId: dto.assigneeId ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order: dto.order ?? 0,
      },
      include: TASK_INCLUDE,
    });

    await this.logActivity(
      task.id,
      userId,
      'created',
      undefined,
      undefined,
      task.title,
    );

    if (dto.labelIds?.length) {
      await this.prisma.taskLabel.createMany({
        data: dto.labelIds.map((labelId) => ({ taskId: task.id, labelId })),
        skipDuplicates: true,
      });
    }
    if (dto.memberIds?.length) {
      await this.prisma.taskMember.createMany({
        data: dto.memberIds.map((uid) => ({ taskId: task.id, userId: uid })),
        skipDuplicates: true,
      });
    }

    return this.findOne(task.id, userId);
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const old = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            workspace: { select: { members: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!old) throw new NotFoundException('Task not found');

    const memberIds =
      old.project?.workspace?.members.map((m) => m.userId) ?? [];
    if (!memberIds.includes(userId))
      throw new ForbiddenException('Access denied');

    // Build update payload and track changes
    const updateData: Record<string, unknown> = {};
    const trackFields = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assigneeId',
    ] as const;

    for (const f of trackFields) {
      if (dto[f] === undefined) continue;
      const oldVal =
        f === 'dueDate'
          ? (old.dueDate?.toISOString().split('T')[0] ?? '')
          : String(old[f] ?? '');
      const newVal =
        f === 'dueDate'
          ? dto[f]
            ? new Date(dto[f]).toISOString().split('T')[0]
            : ''
          : String(dto[f] ?? '');

      if (oldVal !== newVal) {
        await this.logActivity(
          id,
          userId,
          'updated',
          f,
          oldVal || null,
          newVal || null,
        );
      }
      updateData[f] =
        f === 'dueDate' ? (dto[f] ? new Date(dto[f]) : null) : dto[f];
    }
    if (dto.order !== undefined) updateData.order = dto.order;

    await this.prisma.task.update({ where: { id }, data: updateData });

    if (dto.labelIds !== undefined) {
      await this.prisma.taskLabel.deleteMany({ where: { taskId: id } });
      if (dto.labelIds.length) {
        await this.prisma.taskLabel.createMany({
          data: dto.labelIds.map((labelId) => ({ taskId: id, labelId })),
          skipDuplicates: true,
        });
      }
    }
    if (dto.memberIds !== undefined) {
      await this.prisma.taskMember.deleteMany({ where: { taskId: id } });
      if (dto.memberIds.length) {
        await this.prisma.taskMember.createMany({
          data: dto.memberIds.map((uid) => ({ taskId: id, userId: uid })),
          skipDuplicates: true,
        });
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            workspace: { select: { members: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const memberIds =
      task.project?.workspace?.members.map((m) => m.userId) ?? [];
    if (!memberIds.includes(userId))
      throw new ForbiddenException('Access denied');

    await this.prisma.task.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ─── Subtasks ───────────────────────────────────────────────────────────────

  async createSubtask(taskId: string, dto: CreateSubtaskDto, userId: string) {
    await this.assertTaskAccess(taskId, userId);
    const sub = await this.prisma.subtask.create({
      data: { taskId, title: dto.title },
    });
    await this.logActivity(
      taskId,
      userId,
      'added_subtask',
      'subtask',
      null,
      dto.title,
    );
    return sub;
  }

  async updateSubtask(
    subId: string,
    dto: UpdateSubtaskDto,
    taskId: string,
    userId: string,
  ) {
    await this.assertTaskAccess(taskId, userId);
    const sub = await this.prisma.subtask.findUnique({ where: { id: subId } });
    if (!sub || sub.taskId !== taskId)
      throw new NotFoundException('Subtask not found');

    const updated = await this.prisma.subtask.update({
      where: { id: subId },
      data: dto,
    });
    if (dto.done !== undefined) {
      await this.logActivity(
        taskId,
        userId,
        'updated',
        'subtask',
        dto.done ? 'incomplete' : 'complete',
        dto.done ? 'complete' : 'incomplete',
      );
    }
    return updated;
  }

  async deleteSubtask(subId: string, taskId: string, userId: string) {
    await this.assertTaskAccess(taskId, userId);
    const sub = await this.prisma.subtask.findUnique({ where: { id: subId } });
    if (!sub || sub.taskId !== taskId)
      throw new NotFoundException('Subtask not found');
    await this.prisma.subtask.delete({ where: { id: subId } });
    return { deleted: true, id: subId };
  }

  // ─── Comments ───────────────────────────────────────────────────────────────

  async getComments(taskId: string, userId: string) {
    await this.assertTaskAccess(taskId, userId);
    return this.prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(taskId: string, dto: CreateCommentDto, userId: string) {
    await this.assertTaskAccess(taskId, userId);
    const comment = await this.prisma.comment.create({
      data: { taskId, userId, content: dto.content },
      include: { user: { select: USER_SELECT } },
    });
    await this.logActivity(
      taskId,
      userId,
      'commented',
      undefined,
      undefined,
      dto.content.slice(0, 80),
    );
    return comment;
  }

  async updateComment(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException("Cannot edit another user's comment");
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: { user: { select: USER_SELECT } },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException("Cannot delete another user's comment");
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { deleted: true, id: commentId };
  }

  async getActivity(taskId: string, userId: string) {
    await this.assertTaskAccess(taskId, userId);
    return this.prisma.activityLog.findMany({
      where: { taskId },
      include: { user: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        workspace: { select: { members: { select: { userId: true } } } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    const isMember = project.workspace.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Access denied');
  }

  private async assertTaskAccess(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        project: {
          select: {
            workspace: { select: { members: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    const isMember =
      task.project?.workspace?.members.some((m) => m.userId === userId) ??
      false;
    if (!isMember) throw new ForbiddenException('Access denied');
  }

  private async logActivity(
    taskId: string,
    userId: string,
    action: string,
    field?: string,
    oldValue?: string | null,
    newValue?: string | null,
  ) {
    await this.prisma.activityLog.create({
      data: { taskId, userId, action, field, oldValue, newValue },
    });
  }
}
