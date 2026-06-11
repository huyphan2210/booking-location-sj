import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './location.entity';
import { LocationResponseDto } from './dto/location-response.dto';
import { toLocationResponseDto } from './location.mapper';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(Location)
    private readonly repository: Repository<Location>,
  ) {}

  async create(dto: CreateLocationDto): Promise<LocationResponseDto> {
    this.logger.log(`Creating location: ${dto.name}`);
    const { parentId, ...payload } = dto;
    const location = this.repository.create(payload as Partial<Location>);

    if (parentId) {
      const parent = await this.repository.findOne({
        where: { id: parentId, isDeleted: false },
      });

      if (!parent) {
        throw new NotFoundException(`Parent location ${parentId} not found`);
      }

      location.parent = parent;
    }

    const saved = await this.repository.save(location);
    this.logger.log(`Location created with id: ${saved.id}`);
    return toLocationResponseDto(saved);
  }

  async findAll(): Promise<LocationResponseDto[]> {
    const locations = await this.repository.find({
      where: { isDeleted: false },
      relations: { parent: true },
    });

    return this.buildTree(locations).map(toLocationResponseDto);
  }

  async findOne(id: string): Promise<LocationResponseDto> {
    const location = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: { parent: true, children: true },
    });

    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    return toLocationResponseDto(location);
  }

  async update(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const { parentId, ...payload } = dto;
    if (parentId === id) {
      throw new BadRequestException('A location cannot be its own parent');
    }

    const location = await this.findLocationEntity(id);
    if (parentId === null) {
      location.parent = undefined;
    } else if (parentId) {
      const parent = await this.repository.findOne({
        where: { id: parentId, isDeleted: false },
      });

      if (!parent) {
        throw new NotFoundException(`Parent location ${parentId} not found`);
      }

      location.parent = parent;
    }

    Object.assign(location, payload);
    const updated = await this.repository.save(location);
    return toLocationResponseDto(updated);
  }

  private async findLocationEntity(id: string): Promise<Location> {
    const location = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: { parent: true, children: true },
    });

    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    return location;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting location: ${id}`);

    const location = await this.repository.findOne({
      where: { id, isDeleted: false },
      relations: { children: true },
    });

    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    const activeChildren =
      location.children?.filter((child) => !child.isDeleted) || [];
    if (activeChildren.length > 0) {
      this.logger.warn(
        `Cannot delete location ${id} - has ${activeChildren.length} child nodes`,
      );

      throw new BadRequestException(
        'Cannot delete a location with child nodes',
      );
    }

    location.isDeleted = true;
    await this.repository.save(location);

    this.logger.log(`Location deleted: ${id}`);
  }

  private buildTree(locations: Location[]): Location[] {
    const map = new Map<string, Location & { children: Location[] }>();

    locations.forEach((location) => {
      map.set(location.id, {
        ...location,
        children: [],
      });
    });

    const result: Array<Location & { children: Location[] }> = [];

    map.forEach((node) => {
      if (node.parent?.id) {
        const parent = map.get(node.parent.id);
        if (parent) {
          parent.children.push(node);
          return;
        }
      }
      result.push(node);
    });

    return result;
  }
}
