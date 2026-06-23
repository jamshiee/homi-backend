import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './users.entity';
import { PropertiesService } from '../properties/properties.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => PropertiesService))
    private readonly propertiesService: PropertiesService,
  ) {}

  async findOrCreate(
    phone: string,
    preferredLanguage?: string,
  ): Promise<{ user: User; isNew: boolean }> {
    let user = await this.repo.findOne({
      where: { phone },
      relations: ['profileMedia'],
    });
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

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({
      where: { id, isActive: true },
      relations: ['profileMedia'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
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

  async deleteAccount(id: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find and delete all properties listed by this user
    // We fetch them without pagination because we want to delete all.
    // The findByUser from properties service uses pagination, so let's just 
    // fetch their IDs from the user's properties directly if we want, or use the service to get all.
    const userProperties = await this.propertiesService.findByUser(id, { page: 1, limit: 1000 });
    
    for (const property of userProperties.data) {
      await this.propertiesService.remove(property.id, id);
    }

    // Append timestamp to phone number to free it up for re-registration
    const deletedPhone = `${user.phone}_deleted_${Date.now()}`;
    await this.repo.update(id, { phone: deletedPhone, isActive: false });

    // Soft delete the user
    await this.repo.softRemove(user);
  }
}
