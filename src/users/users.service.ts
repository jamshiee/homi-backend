import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async findOrCreate(
    phone: string,
    preferredLanguage?: string,
  ): Promise<{ user: User; isNew: boolean }> {
    let user = await this.repo.findOne({ where: { phone } });
    if (user) {
      if (user.preferredLanguage !== preferredLanguage) {
        user = await this.repo.save({ ...user, preferredLanguage });
      }
      return { user, isNew: false };
    }
    user = await this.repo.save({
      phone,
      isActive: true,
      preferredLanguage: preferredLanguage || 'en',
    });

    return { user, isNew: true };
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id, isActive: true } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }

  async updateProfile(
    id: string,
    updates: Partial<
      Pick<User, 'name' | 'preferredLanguage' | 'profileMediaId'>
    >,
  ): Promise<User> {
    await this.repo.update(id, updates);
    const user = await this.findById(id);
    if (!user) throw new NotFoundException();
    return user;
  }

  isAdmin(phone: string): boolean {
    return (this.config.get<string[]>('admin.numbers') || []).includes(phone);
  }
}
