import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './auth.dto';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  provider: true,
  title: true,
  username: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashed },
    });

    const slug = 'my-workspace-' + Date.now();
    await this.prisma.workspace.create({
      data: {
        name: `${user.name.split(' ')[0]}'s Workspace`,
        slug,
        ownerId: user.id,
        members: { create: { userId: user.id, role: 'owner' } },
      },
    });

    return this.signToken(user.id, user.email, user.name, user.avatar);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Account not found. Please click "Sign up" to create an account.',
      );
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }
    return this.signToken(user.id, user.email, user.name, user.avatar);
  }

  async guestLogin() {
    const ts = Date.now();
    const email = `guest_${ts}@guest.local`;
    const user = await this.prisma.user.create({
      data: { name: 'Guest User', email, provider: 'guest' },
    });

    const slug = 'guest-workspace-' + ts;
    const workspace = await this.prisma.workspace.create({
      data: {
        name: "Guest's Workspace",
        slug,
        ownerId: user.id,
        members: { create: { userId: user.id, role: 'owner' } },
      },
    });

    const project = await this.prisma.project.create({
      data: {
        name: 'AbleSpace Launch',
        description:
          'Sample project with tasks and subtasks for exploring AbleSpace.',
        color: '#6366f1',
        status: 'active',
        priority: 'high',
        workspaceId: workspace.id,
        leadId: user.id,
      },
    });

    const devLabel = await this.prisma.label.create({
      data: { name: 'Engineering', color: '#3b82f6', projectId: project.id },
    });
    const designLabel = await this.prisma.label.create({
      data: { name: 'Design', color: '#ec4899', projectId: project.id },
    });

    await this.prisma.task.create({
      data: {
        title: 'Design System & Base UI',
        description:
          'Set up Tailwind CSS variables, theme toggles, and base UI components.',
        status: 'completed',
        priority: 'high',
        projectId: project.id,
        assigneeId: user.id,
        order: 0,
        subtasks: {
          create: [
            { title: 'Color palette definition', done: true },
            { title: 'Responsive sidebar & header', done: true },
          ],
        },
        labels: { create: { labelId: designLabel.id } },
      },
    });

    await this.prisma.task.create({
      data: {
        title: 'Explore AbleSpace Kanban Board',
        description:
          'Drag and drop cards, create subtasks, and leave comments.',
        status: 'doing',
        priority: 'high',
        projectId: project.id,
        assigneeId: user.id,
        order: 1,
        subtasks: {
          create: [
            { title: 'Try switching between Board & List view', done: true },
            { title: 'Add a new task', done: false },
          ],
        },
        labels: { create: { labelId: devLabel.id } },
      },
    });

    await this.prisma.task.create({
      data: {
        title: 'Customize Your Settings',
        description: 'Try changing the accent color and theme in Settings.',
        status: 'todo',
        priority: 'medium',
        projectId: project.id,
        assigneeId: user.id,
        order: 2,
      },
    });

    return this.signToken(user.id, user.email, user.name, user.avatar);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const conflict = await this.prisma.user.findFirst({
        where: { username: dto.username, NOT: { id: userId } },
      });
      if (conflict) throw new ConflictException('Username already taken');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
  }

  private signToken(
    userId: string,
    email: string,
    name: string,
    avatar: string | null,
  ) {
    const token = this.jwt.sign({ sub: userId, email });
    return { token, user: { id: userId, email, name, avatar } };
  }
}
