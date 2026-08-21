import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ablespace?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding database...');

  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@ablespace.local' },
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    demoUser = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@ablespace.local',
        username: 'demouser',
        title: 'Product Manager',
        password: hashedPassword,
        provider: 'local',
      },
    });
    console.log('Created demo user: demo@ablespace.local / password123');
  }

  let workspace = await prisma.workspace.findFirst({
    where: { ownerId: demoUser.id },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Demo Workspace',
        slug: 'demo-workspace-' + Date.now(),
        ownerId: demoUser.id,
        members: {
          create: { userId: demoUser.id, role: 'owner' },
        },
      },
    });
    console.log('Created demo workspace');
  }

  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'AbleSpace Launch',
        description: 'Key deliverables and tasks for launching AbleSpace platform.',
        color: '#6366f1',
        status: 'active',
        priority: 'high',
        workspaceId: workspace.id,
        leadId: demoUser.id,
      },
    });

    const devLabel = await prisma.label.create({
      data: { name: 'Engineering', color: '#3b82f6', projectId: project.id },
    });
    const designLabel = await prisma.label.create({
      data: { name: 'Design', color: '#ec4899', projectId: project.id },
    });

    await prisma.task.create({
      data: {
        title: 'Design System & UI Components',
        description: 'Set up Tailwind CSS variables, theme toggles, and base UI components.',
        status: 'completed',
        priority: 'high',
        projectId: project.id,
        assigneeId: demoUser.id,
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

    const task2 = await prisma.task.create({
      data: {
        title: 'Backend NestJS REST API',
        description: 'Implement NestJS modules, JWT auth, Prisma ORM integration.',
        status: 'doing',
        priority: 'high',
        projectId: project.id,
        assigneeId: demoUser.id,
        order: 1,
        subtasks: {
          create: [
            { title: 'Auth module & JWT guards', done: true },
            { title: 'Workspaces & Projects CRUD', done: true },
            { title: 'Tasks, comments & subtasks API', done: false },
          ],
        },
        labels: { create: { labelId: devLabel.id } },
      },
    });

    await prisma.task.create({
      data: {
        title: 'User Analytics & Metrics Dashboard',
        description: 'Track task completion stats and active project velocity.',
        status: 'todo',
        priority: 'medium',
        projectId: project.id,
        assigneeId: demoUser.id,
        order: 2,
      },
    });

    await prisma.comment.create({
      data: {
        content: 'Initial NestJS setup looks great! All endpoints verified.',
        taskId: task2.id,
        userId: demoUser.id,
      },
    });

    console.log('Created demo project and sample tasks');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
