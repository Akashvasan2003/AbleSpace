import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedpassword'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user_cuid_001',
  email: 'test@example.com',
  name: 'Test User',
  password: '$2a$12$hashedpassword',
  avatar: null,
  provider: 'local',
  title: null,
  username: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  workspace: {
    create: jest.fn().mockResolvedValue({ id: 'ws_001' }),
  },
  project: {
    create: jest.fn().mockResolvedValue({ id: 'proj_001' }),
  },
  label: {
    create: jest.fn().mockResolvedValue({ id: 'label_001' }),
  },
  task: {
    create: jest.fn().mockResolvedValue({ id: 'task_001' }),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'pass123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      const result = await service.register({
        name: 'Test User',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result).toHaveProperty('token', 'mock.jwt.token');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
      });
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns token on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login({
        email: 'test@example.com',
        password: 'correct',
      });
      expect(result).toHaveProperty('token');
    });
  });

  describe('guestLogin', () => {
    it('creates a guest user and returns token', async () => {
      const guestUser = {
        ...mockUser,
        email: 'guest_123@guest.local',
        provider: 'guest',
      };
      mockPrisma.user.create.mockResolvedValue(guestUser);
      const result = await service.guestLogin();
      expect(result).toHaveProperty('token');
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ provider: 'guest' }) as unknown,
        }),
      );
    });
  });

  describe('getMe', () => {
    it('throws NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getMe(mockUser.id);
      expect(result).toMatchObject({ id: mockUser.id });
    });
  });

  describe('updateProfile', () => {
    it('throws ConflictException if username taken by another user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'other_user' });
      await expect(
        service.updateProfile(mockUser.id, { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('updates and returns user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated',
      });
      const result = await service.updateProfile(mockUser.id, {
        name: 'Updated',
      });
      expect(result).toMatchObject({ name: 'Updated' });
    });
  });
});
